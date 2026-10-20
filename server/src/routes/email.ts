import { Router } from "express"
import multer from "multer"
import { z } from "zod"
import { sendEmail } from "../mail/transport.js"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    cb(null, allowed.includes(file.mimetype))
  },
})

const emailSchema = z.object({
  to: z.string().email(),
  senderName: z.string().max(100).optional(),
  message: z.string().max(300).optional(),
})

export const emailRouter = Router()

emailRouter.post("/email", upload.array("photos"), async (req, res): Promise<void> => {
  const parsed = emailSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: "VALIDATION", message: "Data tidak valid" })
    return
  }

  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ ok: false, code: "VALIDATION", message: "Minimal 1 foto diperlukan" })
    return
  }
  if (files.length > 5) {
    res.status(400).json({ ok: false, code: "VALIDATION", message: "Maksimal 5 foto per kirim" })
    return
  }

  const totalSize = files.reduce((sum, f) => sum + f.buffer.length, 0)
  if (totalSize > 15 * 1024 * 1024) {
    res.status(400).json({ ok: false, code: "TOO_LARGE", message: "Total lampiran melebihi 15 MB" })
    return
  }

  try {
    await sendEmail({
      to: parsed.data.to,
      senderName: parsed.data.senderName,
      message: parsed.data.message,
      attachments: files.map(f => ({
        filename: `snapbox-${Date.now()}-${f.originalname}`,
        content: f.buffer,
        contentType: f.mimetype,
      })),
    })
    res.json({ ok: true })
    return
  } catch (err) {
    console.error("Email send failed:", err)
    res.status(500).json({ ok: false, code: "MAIL_FAILED", message: "Gagal mengirim email" })
    return
  }
})
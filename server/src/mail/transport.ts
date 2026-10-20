import nodemailer from "nodemailer"
import { config } from "../env.js"
import { emailTemplate } from "./template.js"

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error("SMTP not configured")
    }
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    })
    transporter.verify().catch(err => {
      console.warn("SMTP verify failed:", err.message)
    })
  }
  return transporter
}

export interface EmailOptions {
  to: string
  senderName?: string
  message?: string
  attachments: { filename: string; content: Buffer; contentType: string }[]
}

export async function sendEmail(opts: EmailOptions) {
  const tx = getTransporter()
  const html = emailTemplate({ senderName: opts.senderName, message: opts.message })
  const text = `Foto dari Snapbox\n\n${opts.senderName ? `Dari: ${opts.senderName}\n` : ""}${opts.message ? `Pesan: ${opts.message}\n` : ""}\n---\nFoto terlampir.`

  await tx.sendMail({
    from: config.MAIL_FROM,
    to: opts.to,
    subject: `Foto dari ${config.MAIL_FROM.split("<")[0].trim()}`,
    text,
    html,
    attachments: opts.attachments,
  })
}
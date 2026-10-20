export interface SendEmailPayload {
  to: string
  senderName?: string
  message?: string
  photos: Blob[]
}

export async function sendEmailApi(payload: SendEmailPayload): Promise<{ ok: boolean; code?: string; message?: string }> {
  const formData = new FormData()
  formData.append("to", payload.to)
  if (payload.senderName) formData.append("senderName", payload.senderName)
  if (payload.message) formData.append("message", payload.message)

  for (let i = 0; i < payload.photos.length; i++) {
    formData.append("photos", payload.photos[i], `photo_${i + 1}.jpg`)
  }

  try {
    const res = await fetch("/api/email", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    return data
  } catch (err) {
    console.error("Email API error:", err)
    return { ok: false, code: "NETWORK_ERROR", message: "Gagal terhubung ke server email" }
  }
}

export interface EmailTemplateData {
  senderName?: string
  message?: string
}

export function emailTemplate({ senderName, message }: EmailTemplateData): string {
  const accent = "#D93A2F"
  const bg = "#F4EFE6"
  const surface = "#FFFFFF"
  const ink = "#17171A"
  const muted = "#5E5E66"
  const line = "#D9D2C3"

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Foto dari Snapbox</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Inter,Arial,sans-serif;line-height:1.5;color:${ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px;">
    <tr>
      <td style="background:${surface};border:1px solid ${line};border-radius:12px;padding:32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding-bottom:24px;border-bottom:2px solid ${line};">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:${accent};">Snapbox</h1>
              <p style="margin:8px 0 0;color:${muted};font-size:14px;">Foto photobooth Anda siap diunduh</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;">
              ${senderName ? `<p style="margin:0 0 12px;"><strong>Dari:</strong> ${escapeHtml(senderName)}</p>` : ""}
              ${message ? `<p style="margin:0;"><strong>Pesan:</strong> ${escapeHtml(message)}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;border-top:2px solid ${line};text-align:center;color:${muted};font-size:13px;">
              <p style="margin:0;">Foto terlampir sebagai lampiran email.</p>
              <p style="margin:8px 0 0;">© Snapbox — Photobooth Web untuk Laptop</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
}
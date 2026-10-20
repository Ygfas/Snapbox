export async function createThumbnail(blob: Blob, maxWidth = 320): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = maxWidth / img.width
      const width = maxWidth
      const height = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error("Failed to create thumbnail blob"))
        },
        "image/jpeg",
        0.85
      )
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

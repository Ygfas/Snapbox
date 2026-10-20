import JSZip from "jszip"
import type { Capture } from "../db/dexie"

export async function exportCapturesAsZip(captures: Capture[], sectionName: string): Promise<Blob> {
  const zip = new JSZip()
  const folder = zip.folder(sectionName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "snapbox_photos")

  if (!folder) {
    throw new Error("Failed to create folder in zip")
  }

  for (let i = 0; i < captures.length; i++) {
    const cap = captures[i]
    const dateStr = new Date(cap.createdAt).toISOString().replace(/[:.]/g, "-")
    folder.file(`snapbox_${dateStr}_${i + 1}.jpg`, cap.composite)
  }

  return await zip.generateAsync({ type: "blob" })
}

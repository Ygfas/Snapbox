import Dexie, { type Table } from "dexie"
import type { LayoutCode } from "../config/layouts"
import type { FilterId } from "../config/filters"

export interface Sticker {
  id: string
  emoji: string
  x: number
  y: number
  scale: number
  rotation: number
}

export interface Section {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface Capture {
  id: string
  sectionId: string
  layout: LayoutCode
  createdAt: number
  composite: Blob
  thumb: Blob
  shots: Blob[]
  style: {
    frameColor: string
    footerText: string
    filter: FilterId
    stickers: Sticker[]
  }
  width: number
  height: number
  bytes: number
}

export class SnapboxDB extends Dexie {
  sections!: Table<Section, string>
  captures!: Table<Capture, string>

  constructor() {
    super("SnapboxDB")
    this.version(1).stores({
      sections: "id, name, createdAt",
      captures: "id, sectionId, createdAt",
    })
  }
}

export const db = new SnapboxDB()

export async function initDefaultSection(): Promise<string> {
  const count = await db.sections.count()
  if (count === 0) {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.sections.add({
      id,
      name: "Sesi 1",
      createdAt: now,
      updatedAt: now,
    })
    return id
  } else {
    const first = await db.sections.orderBy("createdAt").first()
    return first ? first.id : ""
  }
}

export async function runTtlCleanup(ttlDays: number): Promise<number> {
  if (ttlDays <= 0) return 0
  const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000
  const oldCaptures = await db.captures.where("createdAt").below(cutoff).toArray()
  const ids = oldCaptures.map(c => c.id)
  if (ids.length > 0) {
    await db.captures.bulkDelete(ids)
  }
  return ids.length
}

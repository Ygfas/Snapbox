import { describe, it, expect } from "vitest"
import { getLayoutMetrics } from "../config/layouts"

describe("Layout Metrics", () => {
  it("should calculate metrics for layout 1", () => {
    const m = getLayoutMetrics("1")
    expect(m.width).toBe(720)
    expect(m.height).toBe(680)
    expect(m.cellPositions.length).toBe(1)
  })

  it("should calculate metrics for layout 2v", () => {
    const m = getLayoutMetrics("2v")
    expect(m.width).toBe(720)
    expect(m.height).toBe(1180)
    expect(m.cellPositions.length).toBe(2)
  })

  it("should calculate metrics for layout 2h", () => {
    const m = getLayoutMetrics("2h")
    expect(m.width).toBe(1380)
    expect(m.height).toBe(680)
    expect(m.cellPositions.length).toBe(2)
  })

  it("should calculate metrics for layout 3v", () => {
    const m = getLayoutMetrics("3v")
    expect(m.width).toBe(720)
    expect(m.height).toBe(1680)
    expect(m.cellPositions.length).toBe(3)
  })

  it("should calculate metrics for layout 4v", () => {
    const m = getLayoutMetrics("4v")
    expect(m.width).toBe(720)
    expect(m.height).toBe(2180)
    expect(m.cellPositions.length).toBe(4)
  })

  it("should calculate metrics for layout 4g", () => {
    const m = getLayoutMetrics("4g")
    expect(m.width).toBe(1380)
    expect(m.height).toBe(1180)
    expect(m.cellPositions.length).toBe(4)
  })
})

import React, { useEffect, useState } from "react"
import { i18n } from "../../i18n/id"

export const StorageMeter: React.FC = () => {
  const [usageMb, setUsageMb] = useState<number>(0)
  const [quotaMb, setQuotaMb] = useState<number>(100)
  const [percent, setPercent] = useState<number>(0)

  useEffect(() => {
    async function checkStorage() {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        const used = estimate.usage || 0
        const quota = estimate.quota || 1024 * 1024 * 1024
        const usedMb = Number((used / (1024 * 1024)).toFixed(1))
        const totalMb = Number((quota / (1024 * 1024)).toFixed(0))
        setUsageMb(usedMb)
        setQuotaMb(totalMb)
        setPercent(Math.min(100, Math.round((used / quota) * 100)))
      }
    }
    checkStorage()
  }, [])

  return (
    <div className="space-y-2 text-xs text-[var(--color-muted)]">
      <div className="flex justify-between font-medium text-[var(--color-ink)]">
        <span>{i18n.storage.title}</span>
        <span>{usageMb} MB / {quotaMb} MB ({percent}%)</span>
      </div>
      <div className="w-full h-3 rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-surface)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] leading-tight">{i18n.storage.notice}</p>
    </div>
  )
}

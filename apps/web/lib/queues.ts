import type { TranslationKey } from "@/lib/i18n/dictionaries"

const KNOWN_QUEUES = new Set([400, 420, 430, 440, 450, 490, 700, 720, 900, 1020, 1300, 1700, 1900])

/** Localized queue label. Falls back to "other" for unmapped / null queues. */
export function queueKey(queueId: number | null | undefined): TranslationKey {
  if (queueId != null && KNOWN_QUEUES.has(queueId)) {
    return `queue.${queueId}` as TranslationKey
  }
  // Arena alt id 1710 maps to the same label.
  if (queueId === 1710) return "queue.1700"
  return "queue.other"
}

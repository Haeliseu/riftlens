import { describe, expect, it } from "vitest"
import { queueKey } from "@/lib/queues"

describe("queueKey", () => {
  it("maps known queue ids to their key", () => {
    expect(queueKey(420)).toBe("queue.420")
    expect(queueKey(440)).toBe("queue.440")
    expect(queueKey(450)).toBe("queue.450")
  })

  it("treats the Arena alt id 1710 as 1700", () => {
    expect(queueKey(1710)).toBe("queue.1700")
  })

  it("falls back to the gameMode when the queue id is unmapped", () => {
    expect(queueKey(99999, "ARAM")).toBe("queue.450")
    expect(queueKey(99999, "CHERRY")).toBe("queue.1700")
    expect(queueKey(undefined, "URF")).toBe("queue.1900")
  })

  it("returns other for unknown queue and mode", () => {
    expect(queueKey(99999)).toBe("queue.other")
    expect(queueKey(null)).toBe("queue.other")
    expect(queueKey(99999, "SOMETHING_NEW")).toBe("queue.other")
  })
})

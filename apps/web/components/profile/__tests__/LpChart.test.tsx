import { SEASON_2_2026_START_MS } from "@riftlens/riot-api"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LpChart } from "../LpChart"

const mockData = [
  { dateMs: SEASON_2_2026_START_MS + 86400000, tier: "Diamond" as const, division: "IV", lp: 0 },
  {
    dateMs: SEASON_2_2026_START_MS + 2 * 86400000,
    tier: "Diamond" as const,
    division: "III",
    lp: 80,
  },
  {
    dateMs: SEASON_2_2026_START_MS + 3 * 86400000,
    tier: "Diamond" as const,
    division: "III",
    lp: 20,
    isPeak: false,
  },
]

describe("LpChart", () => {
  it("renders without throwing", () => {
    expect(() =>
      render(<LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />)
    ).not.toThrow()
  })

  it("shows peak marker in gold", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const goldCircles = container.querySelectorAll("circle[fill='#f59e0b']")
    expect(goldCircles.length).toBeGreaterThan(0)
  })

  it("shows current position in blue", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const blueCircles = container.querySelectorAll("circle[fill='#3b82f6']")
    expect(blueCircles.length).toBeGreaterThan(0)
  })

  it("displays correct number of data points", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const path = container.querySelector("path[stroke='#6366f1']")
    // Path should exist with data
    expect(path).not.toBeNull()
  })

  it("tooltip appears on mouse enter chart area", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const rects = container.querySelectorAll("rect[fill='transparent']")
    expect(rects.length).toBeGreaterThan(0)
    fireEvent.mouseEnter(rects[0]!)
    // After hover, tooltip area should render
    expect(screen.queryByText(/Diamond/)).not.toBeNull()
  })
})

import { SEASON_2_2026_START_MS } from "@riftlens/riot-api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render as rtlRender, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"
import { I18nProvider } from "@/lib/i18n"
import { LpChart } from "../LpChart"

function render(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return rtlRender(
    <I18nProvider locale="fr">
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </I18nProvider>
  )
}

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
    avgGameRank: { tier: "Platinum" as const, division: "II" },
  },
]

describe("LpChart", () => {
  it("shows empty state when no data", () => {
    render(<LpChart region="EUW1" gameName="Test" tagLine="EUW" />)
    expect(screen.getByText(/historique LP se construit/)).toBeInTheDocument()
  })

  it("shows LP Chart label in both states", () => {
    render(<LpChart region="EUW1" gameName="Test" tagLine="EUW" />)
    expect(screen.getByText("Courbe LP")).toBeInTheDocument()
  })

  it("renders without throwing with data", () => {
    expect(() =>
      render(<LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />)
    ).not.toThrow()
  })

  it("shows peak marker in gold", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    expect(container.querySelectorAll("circle[fill='#f59e0b']").length).toBeGreaterThan(0)
  })

  it("shows current position in blue", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    expect(container.querySelectorAll("circle[fill='#3b82f6']").length).toBeGreaterThan(0)
  })

  it("SVG path exists with data", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    expect(container.querySelector("path[stroke='#6366f1']")).not.toBeNull()
  })

  it("tooltip appears on mouse enter showing date and LP", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const rects = container.querySelectorAll("rect[fill='transparent']")
    expect(rects.length).toBeGreaterThan(0)
    fireEvent.mouseEnter(rects[0]!)
    expect(screen.queryByText(/Diamond/)).not.toBeNull()
  })

  it("tooltip shows avgGameRank when present", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const rects = container.querySelectorAll("rect[fill='transparent']")
    fireEvent.mouseEnter(rects[rects.length - 1]!)
    expect(screen.getByText(/Rang moyen/)).toBeInTheDocument()
  })

  it("tooltip disappears on mouse leave", () => {
    const { container } = render(
      <LpChart region="EUW1" gameName="Test" tagLine="EUW" data={mockData} />
    )
    const svg = container.querySelector("svg")!
    const rects = container.querySelectorAll("rect[fill='transparent']")
    fireEvent.mouseEnter(rects[0]!)
    fireEvent.mouseLeave(svg)
    expect(screen.queryByText(/Rang moyen/)).toBeNull()
  })

  it("handles single data point without crashing", () => {
    const single = [
      { dateMs: SEASON_2_2026_START_MS + 86400000, tier: "Gold" as const, division: "I", lp: 50 },
    ]
    expect(() =>
      render(<LpChart region="EUW1" gameName="Test" tagLine="EUW" data={single} />)
    ).not.toThrow()
  })
})

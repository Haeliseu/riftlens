"use client"

import { useState } from "react"
import {
  type ChampionSkin,
  type ChromaInfo,
  centeredSplashUrl,
  skinLoadingUrl,
} from "@/lib/champion-detail"
import { useI18n } from "@/lib/i18n"

interface SkinGalleryProps {
  /** Numeric champion key (e.g. "266") for CommunityDragon centered art. */
  champKey: string
  /** Champion id/alias (e.g. "Aatrox") for DDragon loading thumbnails. */
  alias: string
  name: string
  title: string
  tags: string[]
  partype: string
  skins: ChampionSkin[]
  /** Chroma names per skin number (skins without chromas are omitted). */
  chromasBySkin: Record<number, ChromaInfo[]>
}

/**
 * Champion + skins viewer in the League champ-select style: the selected skin's
 * splash fills the stage, with a scrollable strip of skin thumbnails below.
 */
export function SkinGallery({
  champKey,
  alias,
  name,
  title,
  tags,
  partype,
  skins,
  chromasBySkin,
}: SkinGalleryProps) {
  const { t } = useI18n()
  const [num, setNum] = useState(0)
  const selected = skins.find((s) => s.num === num)
  const chromas = chromasBySkin[num] ?? []

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border">
        {/* Selected skin splash (centered art, full) */}
        {/* biome-ignore lint/performance/noImgElement: external CDN splash */}
        <img
          key={num}
          src={centeredSplashUrl(champKey, num)}
          alt=""
          className="block h-auto w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white"
              >
                {tag}
              </span>
            ))}
            {partype && (
              <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
                {partype}
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-3xl font-bold text-white">{name}</h1>
          <p className="text-sm capitalize text-white/80">
            {num === 0 || !selected || selected.name === "default" ? title : selected.name}
          </p>
        </div>
      </div>

      {/* Skin thumbnails */}
      {skins.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {skins.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setNum(s.num)}
              title={s.name === "default" ? name : s.name}
              className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                s.num === num ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              {/* biome-ignore lint/performance/noImgElement: external CDN art */}
              <img
                src={skinLoadingUrl(alias, s.num)}
                alt={s.name === "default" ? name : s.name}
                className="h-24 w-[72px] object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Chroma names for the selected skin */}
      {chromas.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {t("champion.chromas", { n: chromas.length })}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chromas.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-white/20"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

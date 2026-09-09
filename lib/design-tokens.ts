/**
 * ==============================================================================
 * DESIGN SYSTEM TOKENS & RULES (Lens / expertlens.vercel.app)
 * ==============================================================================
 * The landing page at expertlens.vercel.app defines the entire design system.
 * Every new page and component built in this project MUST follow it exactly:
 *
 * DESIGN RULES (non-negotiable, apply to every file you create):
 * - Background: #F5F5F0 (off-white/warm light grey) — the exact same as the landing page
 * - Text primary: #0A0A0A (near black)
 * - Text muted: #6B7280
 * - Font: Inter (already in the project)
 * - Section labels: uppercase, small, tracked, muted — e.g. "EXPERTS", "HOW IT WORKS"
 * - Headings: large, thin weight (font-light or font-thin), black
 * - No heavy shadows. No gradients. No rounded corners larger than 8px.
 * - Buttons: black background, white text, sharp corners (rounded-none or rounded-sm), uppercase tracking-widest
 * - Borders: very subtle, #E5E5E5 or lighter
 * - Layout: generous whitespace, wide padding, clean grid
 * - No blues, no indigo, no color accents — this is a monochrome design
 * ==============================================================================
 */

export const DESIGN_TOKENS = {
  colors: {
    background: "#F5F5F0",
    textPrimary: "#0A0A0A",
    textMuted: "#6B7280",
    border: "#E5E5E5",
    borderLight: "rgba(0, 0, 0, 0.07)",
    surface: "#FFFFFF",
    surfaceAlt: "#FAFAF8",
    black: "#000000",
    white: "#FFFFFF",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    sectionLabel: "text-xs uppercase tracking-widest text-[#6B7280] font-medium",
    headingLarge: "text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#0A0A0A]",
    headingMedium: "text-2xl md:text-3xl font-light tracking-tight text-[#0A0A0A]",
    headingSmall: "text-lg md:text-xl font-light tracking-tight text-[#0A0A0A]",
    body: "text-[#0A0A0A] leading-relaxed",
    bodyMuted: "text-[#6B7280] leading-relaxed",
  },
  buttons: {
    primary:
      "bg-[#0A0A0A] text-white rounded-none sm:rounded-sm uppercase tracking-widest text-xs px-6 py-3 font-medium hover:bg-black/90 transition-colors",
    secondary:
      "bg-transparent text-[#0A0A0A] border border-[#E5E5E5] rounded-none sm:rounded-sm uppercase tracking-widest text-xs px-6 py-3 font-medium hover:border-black/30 transition-colors",
  },
  borders: {
    subtle: "border border-[#E5E5E5]",
    subtleBlack: "border border-black/[0.07]",
  },
  radii: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-[6px]",
    max: "8px", // strict maximum allowed
  },
  layout: {
    pageBg: "bg-[#F5F5F0]",
    container: "max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24",
    grid: "grid gap-6 md:gap-8",
  },
} as const

export type DesignTokens = typeof DESIGN_TOKENS

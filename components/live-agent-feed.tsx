"use client"

import { useEffect, useState, useRef } from "react"

const CITY_ROWS = [
  { name: "Cairo · Doctor", task: "Asking about lower back pain", status: "active" },
  { name: "London · Therapist", task: "Talking through work anxiety", status: "active" },
  { name: "Dubai · Lawyer", task: "Understanding a rental contract", status: "active" },
  { name: "Paris · Advisor", task: "Planning an emergency fund", status: "active" },
  { name: "NYC · Engineer", task: "Debugging a React hook issue", status: "active" },
  { name: "Berlin · Coach", task: "Preparing for salary negotiation", status: "complete" },
] as const

const STATUSES = [
  { label: "active", color: "#4ade80" },
  { label: "active", color: "#4ade80" },
  { label: "active", color: "#4ade80" },
  { label: "active", color: "#4ade80" },
  { label: "complete", color: "#60a5fa" },
] as const

type AgentRow = {
  id: string
  name: string
  task: string
  region: string
  status: typeof STATUSES[number]
  progress: number
  elapsed: string
  key: number
}

function randomRow(key: number): AgentRow {
  const person = CITY_ROWS[Math.floor(Math.random() * CITY_ROWS.length)]
  return {
    id: person.name.split(" · ")[0].toLowerCase(),
    name: person.name,
    task: person.task,
    region: "",
    status: STATUSES.find(status => status.label === person.status) ?? STATUSES[0],
    progress: person.status === "complete" ? 99 : Math.floor(Math.random() * 85 + 10),
    elapsed: "",
    key,
  }
}

// Animated progress bar that slowly ticks forward
function ProgressBar({ initial }: { initial: number }) {
  const [pct, setPct] = useState(initial)
  const rafRef = useRef<number>(0)
  const pctRef = useRef(initial)

  useEffect(() => {
    const tick = () => {
      pctRef.current = Math.min(99, pctRef.current + 0.015)
      setPct(Math.round(pctRef.current))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{ width: "100%", height: 2, background: "rgba(0,0,0,0.08)", borderRadius: 9 }}>
      <div style={{
        height: "100%", borderRadius: 9,
        width: `${pct}%`,
        background: "rgba(0,0,0,0.35)",
        transition: "width 0.5s linear",
      }} />
    </div>
  )
}

// Stable seed rows — same on server and client, no random values
const SEED_ROWS: AgentRow[] = CITY_ROWS.map((person, index) => ({
  id: person.name.split(" · ")[0].toLowerCase(),
  name: person.name,
  task: person.task,
  region: "",
  status: STATUSES.find(status => status.label === person.status) ?? STATUSES[0],
  progress: person.status === "complete" ? 99 : [42, 67, 18, 55, 80][index] ?? 42,
  elapsed: "",
  key: index,
}))

export function LiveAgentFeed() {
  const [rows, setRows] = useState<AgentRow[]>(SEED_ROWS)
  const [mounted, setMounted] = useState(false)
  const keyRef = useRef(100)

  useEffect(() => {
    // Hydrate with random data only after client mount
    setMounted(true)
    setRows(Array.from({ length: 6 }, (_, i) => randomRow(i)))

    const t = setInterval(() => {
      keyRef.current++
      setRows(prev => [...prev.slice(1), randomRow(keyRef.current)])
    }, 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      background: "rgba(255,255,255,0.7)",
    }}>
      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 80px 70px",
        padding: "8px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(0,0,0,0.03)",
      }}>
        {["AGENT", "TASK", "REGION", "STATUS"].map(h => (
          <span key={h} style={{ fontSize: 8, letterSpacing: "0.16em", color: "rgba(0,0,0,0.30)", fontFamily: "monospace" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflow: "hidden" }}>
        {rows.map((row, i) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 80px 70px",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.04)",
              gap: 8,
              alignItems: "center",
              animation: i === rows.length - 1 ? "rowSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both" : "none",
            }}
          >
            {/* Agent */}
            <div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(0,0,0,0.65)", marginBottom: 1 }}>{row.name}</div>
              <div style={{ fontSize: 7.5, fontFamily: "monospace", color: "rgba(0,0,0,0.25)" }}>#{row.id}</div>
            </div>

            {/* Task + progress */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 9, color: "rgba(0,0,0,0.50)", lineHeight: 1.35, marginBottom: 5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{row.task}</div>
              <ProgressBar initial={row.progress} />
            </div>

            {/* Region */}
            <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.30)" }}>{row.region}</div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: row.status.color,
                boxShadow: row.status.label === "active" ? `0 0 6px ${row.status.color}` : "none",
                animation: row.status.label === "active" ? "statusPulse 2s ease-in-out infinite" : "none",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(0,0,0,0.35)" }}>{row.status.label}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export function LiveAgentCounter() {
  const [count, setCount] = useState(3847)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => {
      setCount(v => v + Math.floor(Math.random() * 3 - 1))
    }, 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <span style={{
      fontFamily: "monospace",
      fontSize: "clamp(3rem, 6vw, 5rem)",
      fontWeight: 300,
      color: "rgba(0,0,0,0.85)",
      lineHeight: 1,
      letterSpacing: "-0.02em",
      transition: "color 0.3s ease",
    }}>
      {mounted ? count.toLocaleString("en-US") : "3,847"}
    </span>
  )
}

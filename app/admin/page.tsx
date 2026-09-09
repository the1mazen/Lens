"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { roles } from "@/lib/roles"

interface KnowledgeItem {
  id: string
  role_id: string
  title: string
  rule: string
  is_active: boolean
  created_at: string
}

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tableNotCreated, setTableNotCreated] = useState(false)

  // Form state
  const [selectedRole, setSelectedRole] = useState("all")
  const [formRole, setFormRole] = useState("all")
  const [formTitle, setFormTitle] = useState("")
  const [formRule, setFormRule] = useState("")
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const fetchKnowledge = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/knowledge?roleId=${selectedRole}`)
      const data = await res.json()

      if (data.tableNotCreated) {
        setTableNotCreated(true)
      } else {
        setTableNotCreated(false)
        setItems(data.knowledge ?? [])
      }
    } catch (err) {
      console.error("Failed to load knowledge:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKnowledge()
  }, [selectedRole])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")

    if (!formTitle.trim() || !formRule.trim()) {
      setFormError("Please fill in both the title and the rule.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: formRole === "all" ? "*" : formRole,
          title: formTitle.trim(),
          rule: formRule.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.tableNotCreated) {
          setTableNotCreated(true)
        }
        setFormError(data.error || "Failed to save rule.")
      } else {
        setFormSuccess("Rule successfully taught to expert!")
        setFormTitle("")
        setFormRule("")
        fetchKnowledge()
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: KnowledgeItem) => {
    const nextState = !item.is_active
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: nextState } : i))
    )

    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_active: nextState }),
      })
      if (!res.ok) {
        // Rollback
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_active: !nextState } : i))
        )
      }
    } catch (err) {
      console.error("Toggle error:", err)
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !nextState } : i))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this learned rule?")) return

    setItems((prev) => prev.filter((i) => i.id !== id))

    try {
      await fetch(`/api/admin/knowledge?id=${id}`, {
        method: "DELETE",
      })
    } catch (err) {
      console.error("Delete error:", err)
      fetchKnowledge()
    }
  }

  const getRoleBadge = (roleId: string) => {
    if (roleId === "*") {
      return { emoji: "🌟", name: "All Experts (Global)" }
    }
    const found = roles.find((r) => r.id === roleId)
    return found
      ? { emoji: found.emoji, name: found.name }
      : { emoji: "👤", name: roleId }
  }

  const sqlSetupCode = `create table if not exists expert_knowledge (
  id uuid primary key default gen_random_uuid(),
  role_id text not null,
  title text not null,
  rule text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table expert_knowledge enable row level security;

create policy "Allow all access to expert_knowledge"
  on expert_knowledge for all
  using (true)
  with check (true);`

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0A0A0A] font-sans antialiased flex flex-col">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-[#F5F5F0] border-b border-[#E5E5E5] z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-pixel text-xs tracking-[0.25em] text-black/60 hover:text-black transition-colors"
            >
              LENS
            </Link>
            <div className="h-4 w-px bg-[#E5E5E5]" />
            <span className="text-xs uppercase tracking-widest text-[#6B7280] font-medium">
              ADMIN / KNOWLEDGE BASE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/pick"
              className="text-xs uppercase tracking-widest text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
            >
              ← TALK TO EXPERTS
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-10 md:py-16 space-y-12">
        {/* Title */}
        <div>
          <div className="text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-3">
            CONTINUOUS LEARNING
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#0A0A0A] leading-tight mb-3">
            Teach your AI Experts
          </h1>
          <p className="text-sm md:text-base text-[#6B7280] max-w-2xl leading-relaxed">
            Add custom domain knowledge, protocols, facts, and dos/don’ts. When
            any user chats with an expert, the expert will automatically consult
            and obey these rules.
          </p>
        </div>

        {/* Database setup notice if table is missing */}
        {tableNotCreated && (
          <div className="bg-white border border-[#E5E5E5] p-6 rounded-none sm:rounded-[4px] space-y-3">
            <div className="text-xs uppercase tracking-widest font-semibold text-[#0A0A0A]">
              Action Needed: Create Supabase Table
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Run this one-time SQL script in your{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="underline text-[#0A0A0A]"
              >
                Supabase SQL Editor
              </a>{" "}
              to enable storage for your learned knowledge:
            </p>
            <pre className="bg-[#F5F5F0] p-4 text-xs font-mono text-[#0A0A0A] overflow-x-auto border border-[#E5E5E5] select-all">
              {sqlSetupCode}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sqlSetupCode)
                alert("SQL copied to clipboard!")
              }}
              className="bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest font-medium rounded-none hover:bg-black/90 transition-colors"
            >
              Copy SQL Snippet
            </button>
          </div>
        )}

        {/* Form: Teach an Expert */}
        <div className="bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-6 md:p-8">
          <h2 className="text-lg font-light tracking-tight text-[#0A0A0A] mb-6">
            New Knowledge or Guideline
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-none">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-[#F5F5F0] border border-[#E5E5E5] text-xs text-[#0A0A0A] rounded-none">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Select Target Expert */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-2">
                  Target Expert
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
                >
                  <option value="all">🌟 All Experts (Global Rule)</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.emoji} {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rule Title */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-2">
                  Topic or Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Knee Injury Protocol, Pricing Policy..."
                  required
                  className="w-full border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#6B7280] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
                />
              </div>
            </div>

            {/* Rule / Guideline Content */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-2">
                Guideline / Rule / Learned Information
              </label>
              <textarea
                rows={4}
                value={formRule}
                onChange={(e) => setFormRule(e.target.value)}
                placeholder="Write the exact instruction or knowledge the AI expert should follow when users ask relevant questions..."
                required
                className="w-full border border-[#E5E5E5] bg-white p-3 text-sm text-[#0A0A0A] placeholder:text-[#6B7280] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#0A0A0A] text-white px-6 py-3 text-xs uppercase tracking-widest font-medium rounded-none hover:bg-black/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "TEACHING..." : "TEACH EXPERT"}
            </button>
          </form>
        </div>

        {/* ── KNOWLEDGE LIST ────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-light text-[#0A0A0A] tracking-tight">
                Learned Knowledge Rules ({items.length})
              </h2>
            </div>

            {/* Filter by Role */}
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-[#6B7280]">
                Filter:
              </span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs uppercase tracking-widest text-[#6B7280]">
              Loading knowledge...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] p-8 text-center rounded-none text-xs text-[#6B7280]">
              No custom rules or guidelines taught yet. Use the form above to
              teach your first rule!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => {
                const badge = getRoleBadge(item.role_id)
                return (
                  <div
                    key={item.id}
                    className={`bg-white border border-[#E5E5E5] p-5 rounded-none sm:rounded-[4px] transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                      !item.is_active ? "opacity-50 bg-[#fafaf8]" : ""
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] uppercase tracking-widest text-[#0A0A0A] bg-[#F5F5F0] border border-[#E5E5E5] rounded-none">
                          <span>{badge.emoji}</span>
                          <span className="font-medium">{badge.name}</span>
                        </span>
                        <span className="font-semibold text-sm text-[#0A0A0A]">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">
                        {item.rule}
                      </p>
                      <div className="text-[11px] text-[#6B7280]">
                        Created{" "}
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => handleToggle(item)}
                        className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                          item.is_active
                            ? "border-[#0A0A0A] text-[#0A0A0A] hover:bg-black/[0.04]"
                            : "border-[#E5E5E5] text-[#6B7280] hover:text-[#0A0A0A]"
                        }`}
                      >
                        {item.is_active ? "Active" : "Disabled"}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs uppercase tracking-widest px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 md:px-12 border-t border-[#E5E5E5] mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[#6B7280]">
          <span className="font-pixel text-black/50">LENS ADMIN</span>
          <span>Learned knowledge syncs automatically with active chats.</span>
        </div>
      </footer>
    </div>
  )
}

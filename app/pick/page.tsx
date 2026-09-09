import Link from "next/link"
import { redirect } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { roles } from "@/lib/roles"
import { createServerComponentClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function PickRolePage() {
  const supabase = await createServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="bg-[#F5F5F0] text-[#0A0A0A] min-h-screen flex flex-col font-sans antialiased">
      {/* ── SAME NAVBAR AS LANDING PAGE ─────────────────────────────────── */}
      <MobileNav />

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 lg:px-20 pt-28 md:pt-36 pb-20">
        {/* Top Section */}
        <div className="mb-10 md:mb-14">
          <div className="text-xs uppercase tracking-widest text-[#6B7280] font-medium mb-3">
            EXPERTS
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-[#0A0A0A] leading-[1.08] mb-3">
            Who do you want to talk to?
          </h1>
          <p className="text-sm md:text-base text-[#6B7280]">
            Pick a role and start typing.
          </p>
        </div>

        {/* Grid of Role Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {roles.map((role) => (
            <Link
              key={role.id}
              href={`/chat/${role.id}`}
              className="group block bg-[#FFFFFF] border border-[#E5E5E5] rounded-[4px] p-6 hover:border-[#0A0A0A] cursor-pointer transition-[border-color] duration-150 ease-in-out"
            >
              <div className="text-[36px] leading-none mb-4 select-none">
                {role.emoji}
              </div>
              <div className="font-bold text-[15px] text-[#0A0A0A] mb-1.5 leading-snug">
                {role.name}
              </div>
              <div className="text-[13px] text-[#6B7280] leading-snug">
                {role.tagline}
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* ── SAME FOOTER AS LANDING PAGE ─────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <Link
            href="/"
            className="font-pixel text-xs tracking-[0.25em] text-black/50 hover:text-black/80 transition-colors"
          >
            LENS
          </Link>

          {/* Nav sections */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { label: "Platform", href: "/#platform" },
              { label: "Experts", href: "/pick" },
              { label: "Workflow", href: "/#workflow" },
              { label: "Integrations", href: "/#integrations" },
              { label: "Live", href: "/#live" },
              { label: "Contact", href: "/#contact" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-black/35 hover:text-black/70 transition-colors tracking-widest"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/[0.04]">
          <span className="text-xs text-black/20">
            © 2026 Lens. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}

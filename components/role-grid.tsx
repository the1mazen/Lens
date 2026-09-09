"use client"

import React, { useState } from "react"
import { Role } from "@/lib/roles"
import { IntroOverlay } from "@/components/intro-overlay"

interface RoleGridProps {
  roles: Role[]
}

export function RoleGrid({ roles }: RoleGridProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {roles.map((role) => {
          if (!role.isReady) {
            // Not ready card
            return (
              <div
                key={role.id}
                className="relative block bg-[#FFFFFF] border border-[#E5E5E5] rounded-[4px] overflow-hidden opacity-[0.45] cursor-not-allowed select-none text-left"
              >
                {/* Subtle "Coming soon" label */}
                <span className="absolute top-2.5 right-2.5 z-10 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium text-[#6B7280] bg-white/90 px-2 py-0.5 border border-[#E5E5E5]">
                  Coming soon
                </span>

                {/* Dark placeholder rectangle in place of photo */}
                <div className="w-full aspect-square md:aspect-[4/3] bg-[#0A0A0A]" />

                {/* Content */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="font-bold text-[15px] text-[#0A0A0A] mb-1.5 leading-snug">
                    {role.name}
                  </div>
                  <div className="text-[13px] text-[#6B7280] leading-snug">
                    {role.tagline}
                  </div>
                </div>
              </div>
            )
          }

          // Ready card
          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className="group relative block bg-[#FFFFFF] border border-[#E5E5E5] rounded-[4px] overflow-hidden hover:border-[#0A0A0A] cursor-pointer transition-[border-color] duration-150 ease-in-out text-left"
            >
              {/* Profile Photo at top */}
              <div className="w-full aspect-square md:aspect-[4/3] bg-[#0A0A0A] overflow-hidden relative">
                <img
                  src={`/characters/${role.id}/profile.jpg`}
                  alt={role.name}
                  className="w-full h-full object-cover rounded-none block transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 md:p-6">
                <div className="font-bold text-[15px] text-[#0A0A0A] mb-1.5 leading-snug">
                  {role.name}
                </div>
                <div className="text-[13px] text-[#6B7280] leading-snug">
                  {role.tagline}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Intro Video Fullscreen Overlay */}
      {selectedRole && (
        <IntroOverlay
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </>
  )
}
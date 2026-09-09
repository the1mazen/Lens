"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useChat } from "ai/react"
import { Role } from "@/lib/roles"

interface ChatClientProps {
  role: Role
}

export function ChatClient({ role }: ChatClientProps) {
  const [showRateLimitBanner, setShowRateLimitBanner] = useState(false)
  const [isAugmenting, setIsAugmenting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    append,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: { roleId: role.id },
    initialMessages: [
      {
        id: `opening-${role.id}`,
        role: "assistant",
        content: role.openingMessage,
      },
    ],
    onError: (err) => {
      const msg = err.message || ""
      if (
        msg.includes("rate_limited") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("busy")
      ) {
        setShowRateLimitBanner(true)
      }
    },
  })

  // Watch for reactive error changes
  useEffect(() => {
    if (error) {
      const msg = error.message || ""
      if (
        msg.includes("rate_limited") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("busy")
      ) {
        setShowRateLimitBanner(true)
      }
    }
  }, [error])

  // Auto-dismiss banner after 4 seconds
  useEffect(() => {
    if (showRateLimitBanner) {
      const timer = setTimeout(() => {
        setShowRateLimitBanner(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showRateLimitBanner])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, isAugmenting])

  // Auto-resize textarea up to 4 lines (~112px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 112 // ~4 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [input])

  const handleCustomSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const userText = input.trim()
    if (!userText || isLoading || isAugmenting) return

    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    setIsAugmenting(true)
    let messageToSend = userText

    try {
      const res = await fetch("/api/augment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          roleName: role.name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.augmentedPrompt) {
          messageToSend = data.augmentedPrompt
        }
      }
    } catch (err) {
      console.error("Failed to augment prompt, using original:", err)
    } finally {
      setIsAugmenting(false)
    }

    append({
      role: "user",
      content: messageToSend,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  const isBusy = isLoading || isAugmenting
  const lastMessage = messages[messages.length - 1]
  const showStreamingIndicator =
    isBusy &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      (lastMessage.role === "assistant" && !lastMessage.content))

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[#F5F5F0] text-[#0A0A0A] font-sans antialiased">
      {/* ── HEADER (in navbar or just below it) ─────────────────────────── */}
      <header className="shrink-0 bg-[#F5F5F0] border-b border-[#E5E5E5] z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand + separator + expert emoji + name */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="font-pixel text-xs tracking-[0.25em] text-black/60 hover:text-black shrink-0 transition-colors"
            >
              LENS
            </Link>
            <div className="h-4 w-px bg-[#E5E5E5] shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[24px] leading-none select-none shrink-0">
                {role.emoji}
              </span>
              <span className="font-bold text-[14px] text-[#0A0A0A] truncate">
                {role.name}
              </span>
            </div>
          </div>

          {/* Right: button "← EXPERTS" */}
          <Link
            href="/pick"
            onClick={() => setMessages([])}
            className="bg-[#0A0A0A] text-white text-xs uppercase tracking-widest px-3.5 sm:px-4 py-2 font-medium rounded-none sm:rounded-sm hover:bg-black/90 transition-colors shrink-0"
          >
            ← EXPERTS
          </Link>
        </div>
      </header>

      {/* ── CHAT AREA (fills remaining height, overflow hidden) ─────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Rate limit banner: subtle monochrome design at top of chat area */}
        {showRateLimitBanner && (
          <div className="shrink-0 bg-white border-b border-[#E5E5E5] px-4 py-2.5 text-center text-xs text-[#0A0A0A] tracking-wide transition-all animate-in fade-in slide-in-from-top-1">
            This expert is a little busy right now — try again in a moment.
          </div>
        )}

        {/* ── MESSAGE LIST (flex-1, overflow-y-auto, padding 24px) ──────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((m) => {
              const isUser = m.role === "user"

              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[70%] bg-[#0A0A0A] text-white p-4 rounded-none sm:rounded-[4px] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  </div>
                )
              }

              // Assistant message
              if (!m.content && isBusy) return null

              return (
                <div key={m.id} className="flex items-start gap-3 max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 text-sm select-none">
                    {role.emoji}
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-4 text-[#0A0A0A] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                </div>
              )
            })}

            {/* Streaming indicator: three animated dots shown as expert bubble */}
            {showStreamingIndicator && (
              <div className="flex items-start gap-3 max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 text-sm select-none">
                  {role.emoji}
                </div>
                <div className="bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-4 text-[#0A0A0A] text-[15px]">
                  <span className="inline-flex items-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms]" />
                    <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms] [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms] [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── INPUT BAR (fixed at bottom, same bg, border-top 1px #E5E5E5) ─ */}
        <div className="shrink-0 border-t border-[#E5E5E5] bg-[#F5F5F0] px-4 sm:px-6 pt-3 pb-3 sm:pb-4">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleCustomSubmit}
              className="flex items-end gap-2 bg-white border border-[#E5E5E5] focus-within:border-[#0A0A0A] rounded-none p-2 transition-colors"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${role.name}...`}
                disabled={isBusy}
                className="flex-1 resize-none bg-white text-[#0A0A0A] text-[15px] leading-normal placeholder:text-[#6B7280] focus:outline-none max-h-28 p-1.5 rounded-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isBusy}
                className="h-9 w-9 bg-[#0A0A0A] text-white flex items-center justify-center rounded-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/90 transition-colors shrink-0"
                aria-label="Send message"
              >
                <span className="text-base select-none">→</span>
              </button>
            </form>

            {/* Disclaimer */}
            <div className="text-[11px] text-[#6B7280] text-center pt-2 select-none">
              Lens provides informational conversations only. Not a substitute for professional advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useChat } from "ai/react"
import { generateId } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Role } from "@/lib/roles"

interface ChatClientProps {
  role: Role
}

const markdownComponents = {
  p: ({ children }: any) => (
    <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-[#0A0A0A]">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic">{children}</em>,
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 my-2.5 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 my-2.5 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }: any) => (
    <code className="bg-[#F5F5F0] px-1.5 py-0.5 text-[13px] font-mono border border-[#E5E5E5] rounded-none">
      {children}
    </code>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-[#0A0A0A] pl-3 my-2 text-[#6B7280] italic">
      {children}
    </blockquote>
  ),
}

export function ChatClient({ role }: ChatClientProps) {
  const [showRateLimitBanner, setShowRateLimitBanner] = useState(false)
  const [isAugmenting, setIsAugmenting] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<{
    id: string
    text: string
  } | null>(null)
  const [originalMessages, setOriginalMessages] = useState<Record<string, string>>({})
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

  // Auto scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, isAugmenting, pendingMessage])

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
    const originalMessage = input.trim()
    if (!originalMessage || isLoading || isAugmenting) return

    // Immediately clear input for responsive feel
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Generate unique ID for this user message
    const messageId = generateId()

    // Store original message for UI rendering & show optimistic pending bubble
    setOriginalMessages((prev) => ({
      ...prev,
      [messageId]: originalMessage,
    }))
    setPendingMessage({ id: messageId, text: originalMessage })

    setIsAugmenting(true)
    let augmentedPrompt = originalMessage

    try {
      const res = await fetch("/api/augment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: originalMessage,
          roleName: role.name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.augmentedPrompt) {
          augmentedPrompt = data.augmentedPrompt
        }
      }
    } catch (err) {
      console.error("Failed to augment prompt, using original:", err)
    } finally {
      setIsAugmenting(false)
    }

    // Submit augmented prompt to useChat for LLM inference
    setPendingMessage(null)
    append({
      id: messageId,
      role: "user",
      content: augmentedPrompt,
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

  // Show dots bubble if loading and the assistant message hasn't received its first token yet
  const showDotsIndicator =
    isBusy &&
    !pendingMessage &&
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
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-[#0A0A0A] shrink-0 rounded-none overflow-hidden flex items-center justify-center">
                <img
                  src={`/characters/${role.id}/profile.jpg`}
                  alt={role.name}
                  className="w-full h-full object-cover rounded-none"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
              </div>
              <span className="font-bold text-[14px] text-[#0A0A0A] truncate">
                {role.name}
              </span>
            </div>
          </div>

          {/* Right: button "← EXPERTS" */}
          <Link
            href="/pick"
            onClick={() => {
              setMessages([])
              setOriginalMessages({})
              setPendingMessage(null)
            }}
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
            {messages.map((m, index) => {
              const isUser = m.role === "user"

              if (isUser) {
                // Render the original user-typed message, keeping augmentation invisible to user
                const displayContent = originalMessages[m.id] || m.content

                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[70%] bg-[#0A0A0A] text-white p-4 rounded-none sm:rounded-[4px] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {displayContent}
                    </div>
                  </div>
                )
              }

              // Assistant message
              if (!m.content && isBusy) return null

              const isLast = index === messages.length - 1
              const isStreamingThis = isLast && isLoading

              return (
                <div key={m.id} className="flex items-start gap-3 max-w-[70%]">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0A0A0A] shrink-0 rounded-none overflow-hidden flex items-center justify-center">
                    <img
                      src={`/characters/${role.id}/profile.jpg`}
                      alt={role.name}
                      className="w-full h-full object-cover rounded-none"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-4 text-[#0A0A0A] text-[15px] leading-relaxed break-words">
                    <div className="animate-in fade-in duration-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    {isStreamingThis && (
                      <span className="inline-block ml-0.5 font-mono text-sm text-[#0A0A0A] font-bold animate-pulse select-none">
                        |
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pending optimistic user message while prompt augmentation is running */}
            {pendingMessage && (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-[#0A0A0A] text-white p-4 rounded-none sm:rounded-[4px] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {pendingMessage.text}
                  </div>
                </div>
                <div className="flex items-start gap-3 max-w-[70%]">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0A0A0A] shrink-0 rounded-none overflow-hidden flex items-center justify-center">
                    <img
                      src={`/characters/${role.id}/profile.jpg`}
                      alt={role.name}
                      className="w-full h-full object-cover rounded-none"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-4 text-[#0A0A0A] text-[15px]">
                    <span className="inline-flex items-center gap-1.5 py-1">
                      <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms]" />
                      <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms] [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full animate-bounce [animation-duration:900ms] [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Streaming indicator: three animated dots before the first token arrives */}
            {showDotsIndicator && (
              <div className="flex items-start gap-3 max-w-[70%]">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0A0A0A] shrink-0 rounded-none overflow-hidden flex items-center justify-center">
                  <img
                    src={`/characters/${role.id}/profile.jpg`}
                    alt={role.name}
                    className="w-full h-full object-cover rounded-none"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = "none"
                    }}
                  />
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

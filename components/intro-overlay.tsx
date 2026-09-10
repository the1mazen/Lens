"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Role } from "@/lib/roles"

interface IntroOverlayProps {
  role: Role
  onClose?: () => void
}

export function IntroOverlay({ role }: IntroOverlayProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [videoReady, setVideoReady] = useState(false)
  const videoReadyRef = useRef(false)
  const [videoError, setVideoError] = useState(false)

  const [msgIndex, setMsgIndex] = useState(0)
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "gap">("in")
  const [sequenceDone, setSequenceDone] = useState(false)

  const [showVideo, setShowVideo] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [isFadingToChat, setIsFadingToChat] = useState(false)
  const hasTriggeredNav = useRef(false)

  const messages = [
    `${role.name} is born.`,
    "Taking form...",
    "First breath.",
    "Eyes opening...",
    "Ready.",
  ]

  // Prefetch chat route on mount
  useEffect(() => {
    router.prefetch(`/chat/${role.id}`)
  }, [role.id, router])

  // FIX 3: Smooth exit to chat — fade out video to #F5F5F0 and navigate without flicker
  const triggerTransitionToChat = () => {
    if (hasTriggeredNav.current) return
    hasTriggeredNav.current = true
    setIsFadingToChat(true)

    // Prefetch again to ensure hot cache
    router.prefetch(`/chat/${role.id}`)

    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {}
    }

    // 400ms fade transition to #F5F5F0, then route push.
    // Note: We deliberately do NOT unmount the overlay so /pick never flashes.
    setTimeout(() => {
      router.push(`/chat/${role.id}`)
    }, 400)
  }

  // Handle video ready (canplay / canplaythrough / loadeddata)
  const handleCanPlay = () => {
    if (!videoReadyRef.current) {
      videoReadyRef.current = true
      setVideoReady(true)
    }
  }

  const handleVideoError = () => {
    console.warn(`Intro video for ${role.name} not found or failed to load. Will proceed to chat after sequence.`)
    videoReadyRef.current = true
    setVideoReady(true)
    setVideoError(true)
  }

  // FIX 1: Full sequence progression without skipping early
  useEffect(() => {
    if (sequenceDone) return

    let timer: NodeJS.Timeout

    if (phase === "in") {
      // Fade in: 600ms
      timer = setTimeout(() => {
        setPhase("hold")
      }, 600)
    } else if (phase === "hold") {
      if (msgIndex === 4) {
        // Message is "Ready."
        if (videoReadyRef.current) {
          // If video is already buffered, hold for 900ms then fade out
          timer = setTimeout(() => {
            setPhase("out")
          }, 900)
        } else {
          // Video not ready yet: hold indefinitely until videoReady becomes true
        }
      } else {
        // Normal hold for messages 0, 1, 2, 3: 900ms
        timer = setTimeout(() => {
          setPhase("out")
        }, 900)
      }
    } else if (phase === "out") {
      // Fade out: 400ms
      timer = setTimeout(() => {
        if (msgIndex === 4) {
          // "Ready." has fully faded out — sequence is completely finished
          setSequenceDone(true)
        } else {
          setPhase("gap")
        }
      }, 400)
    } else if (phase === "gap") {
      // Gap between messages: 100ms
      timer = setTimeout(() => {
        setMsgIndex((prev) => prev + 1)
        setPhase("in")
      }, 100)
    }

    return () => clearTimeout(timer)
  }, [msgIndex, phase, sequenceDone])

  // If holding on "Ready." when video becomes ready, complete the hold and fade out
  useEffect(() => {
    if (msgIndex === 4 && phase === "hold" && videoReady) {
      const timer = setTimeout(() => {
        setPhase("out")
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [videoReady, msgIndex, phase])

  // Watchdog: If video buffering hangs on "Ready." for > 7s, mark as ready so user proceeds
  useEffect(() => {
    if (msgIndex === 4 && phase === "hold" && !videoReady) {
      const fallbackTimer = setTimeout(() => {
        console.warn("Video buffer watchdog reached, completing sequence.")
        videoReadyRef.current = true
        setVideoReady(true)
        setVideoError(true)
      }, 7000)
      return () => clearTimeout(fallbackTimer)
    }
  }, [msgIndex, phase, videoReady])

  // FIX 1: Only play AFTER sequenceDone AND videoReady are both true
  useEffect(() => {
    if (sequenceDone && videoReady && !videoStarted) {
      if (videoError) {
        // If the video errored (e.g. file missing), smoothly transition to chat
        triggerTransitionToChat()
        return
      }

      setVideoStarted(true)
      setShowVideo(true)

      if (videoRef.current) {
        videoRef.current.muted = false
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Video play blocked or failed:", err)
            triggerTransitionToChat()
          })
        }
      }
    }
  }, [sequenceDone, videoReady, videoStarted, videoError])

  const isPulsingReady = msgIndex === 4 && phase === "hold" && !videoReady

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F5F5F0] overflow-hidden w-screen h-[100dvh] flex items-center justify-center select-none"
      onClick={() => {
        // User can skip at any point: immediately fades to #F5F5F0 then navigates to chat
        triggerTransitionToChat()
      }}
    >
      {/* ── RESPONSIVE STYLES FOR MOBILE ZOOM (FIX 2) ──────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .intro-video-element {
            width: 118vw !important;
            height: 118dvh !important;
            left: -9vw !important;
            top: -9dvh !important;
            max-width: none !important;
            object-fit: cover !important;
            object-position: center center !important;
            transform: scale(0.85) !important;
            transform-origin: center center !important;
          }
        }
        @media (min-width: 769px) {
          .intro-video-element {
            width: 100vw !important;
            height: 100vh !important;
            left: 0 !important;
            top: 0 !important;
            object-fit: cover !important;
            object-position: center center !important;
            transform: none !important;
            transform-origin: center center !important;
          }
        }
      `}</style>

      {/* ── VIDEO PLAYER ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={`/characters/${role.id}/intro.mp4`}
        className={`intro-video-element absolute transition-opacity duration-500 ease-in-out ${
          isFadingToChat
            ? "opacity-0 pointer-events-none"
            : showVideo
            ? "opacity-100 cursor-pointer"
            : "opacity-0 pointer-events-none"
        }`}
        style={{
          objectFit: "cover",
          objectPosition: "center center",
          transformOrigin: "center center",
        }}
        playsInline
        autoPlay={false}
        muted={false}
        preload="auto"
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlay}
        onLoadedData={handleCanPlay}
        onError={handleVideoError}
        onEnded={triggerTransitionToChat}
      />

      {/* ── CINEMATIC LOADING OVERLAY ────────────────────────────────────── */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center p-6 bg-[#F5F5F0] transition-opacity duration-500 ease-in-out ${
          showVideo || isFadingToChat ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <p
          className={`font-sans font-light text-[#0A0A0A] text-center max-w-2xl px-4 ${
            isPulsingReady
              ? "animate-pulse opacity-100"
              : phase === "in"
              ? "opacity-100 transition-opacity duration-600 ease-out"
              : phase === "hold"
              ? "opacity-100"
              : "opacity-0 transition-opacity duration-400 ease-in"
          }`}
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            letterSpacing: "0.08em",
          }}
        >
          {messages[msgIndex]}
        </p>
      </div>

      {/* ── SMOOTH TRANSITION TO CHAT OVERLAY (#F5F5F0) ──────────────────── */}
      <div
        className={`fixed inset-0 z-20 bg-[#F5F5F0] transition-opacity duration-400 ease-in-out pointer-events-none ${
          isFadingToChat ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
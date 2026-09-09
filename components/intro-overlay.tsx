"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Role } from "@/lib/roles"

interface IntroOverlayProps {
  role: Role
  onClose?: () => void
}

export function IntroOverlay({ role, onClose }: IntroOverlayProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [videoReady, setVideoReady] = useState(false)
  const videoReadyRef = useRef(false)

  const [msgIndex, setMsgIndex] = useState(0)
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "gap">("in")
  const [transitioningToVideo, setTransitioningToVideo] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)

  const messages = [
    `${role.name} is born.`,
    "Taking form...",
    "First breath.",
    "Eyes opening...",
    "Ready.",
  ]

  const navigateToChat = () => {
    if (hasNavigated) return
    setHasNavigated(true)
    if (onClose) onClose()
    router.push(`/chat/${role.id}`)
  }

  // Handle video ready
  const handleCanPlay = () => {
    videoReadyRef.current = true
    setVideoReady(true)
  }

  const handleVideoError = () => {
    console.warn(`Intro video for ${role.name} not found or failed to load. Will fallback to chat.`)
    videoReadyRef.current = true
    setVideoReady(true)
  }

  // Step through cinematic loading messages
  useEffect(() => {
    if (transitioningToVideo) return

    let timer: NodeJS.Timeout

    if (phase === "in") {
      // Fade in: 600ms
      timer = setTimeout(() => {
        setPhase("hold")
      }, 600)
    } else if (phase === "hold") {
      if (msgIndex === 4) {
        // "Ready." message
        if (videoReadyRef.current) {
          // Video is already ready: hold briefly (800ms) then crossfade to video
          timer = setTimeout(() => {
            setTransitioningToVideo(true)
          }, 800)
        } else {
          // Video not ready yet: wait until videoReady becomes true
        }
      } else {
        // Normal message hold: 900ms
        timer = setTimeout(() => {
          setPhase("out")
        }, 900)
      }
    } else if (phase === "out") {
      // Fade out: 400ms
      timer = setTimeout(() => {
        setPhase("gap")
      }, 400)
    } else if (phase === "gap") {
      // Gap between messages: 100ms
      timer = setTimeout(() => {
        if (videoReadyRef.current) {
          // If video loaded during earlier messages, jump straight to "Ready." (index 4)
          setMsgIndex(4)
        } else {
          // Proceed to next message
          setMsgIndex((prev) => Math.min(prev + 1, 4))
        }
        setPhase("in")
      }, 100)
    }

    return () => clearTimeout(timer)
  }, [msgIndex, phase, transitioningToVideo])

  // React to video becoming ready when holding on "Ready."
  useEffect(() => {
    if (videoReady && msgIndex === 4 && phase === "hold" && !transitioningToVideo) {
      const timer = setTimeout(() => {
        setTransitioningToVideo(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [videoReady, msgIndex, phase, transitioningToVideo])

  // Fallback watchdog: if holding on "Ready." for > 4s without video (e.g. missing file), smoothly navigate
  useEffect(() => {
    if (msgIndex === 4 && phase === "hold" && !videoReady) {
      const fallbackTimer = setTimeout(() => {
        console.warn("Video loading timed out, proceeding to chat.")
        navigateToChat()
      }, 5000)
      return () => clearTimeout(fallbackTimer)
    }
  }, [msgIndex, phase, videoReady])

  // Trigger video playback on crossfade
  useEffect(() => {
    if (transitioningToVideo && !videoStarted) {
      setVideoStarted(true)
      if (videoRef.current) {
        videoRef.current.muted = false
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Video play failed (audio policy or missing file):", err)
            navigateToChat()
          })
        }
      }
    }
  }, [transitioningToVideo, videoStarted])

  const isPulsingReady = msgIndex === 4 && phase === "hold" && !videoReady

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F5F5F0] overflow-hidden w-screen h-[100dvh] flex items-center justify-center select-none cursor-pointer"
      onClick={navigateToChat}
    >
      {/* ── VIDEO PLAYER ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={`/characters/${role.id}/intro.mp4`}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
          transitioningToVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          width: "100vw",
          height: "100dvh",
          objectFit: "cover",
        }}
        playsInline
        autoPlay
        muted={false}
        preload="auto"
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlay}
        onLoadedData={handleCanPlay}
        onError={handleVideoError}
        onEnded={navigateToChat}
      />

      {/* ── CINEMATIC LOADING OVERLAY ────────────────────────────────────── */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center p-6 bg-[#F5F5F0] transition-opacity duration-500 ease-in-out ${
          transitioningToVideo ? "opacity-0 pointer-events-none" : "opacity-100"
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
    </div>
  )
}
"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")

  const clearErrors = () => {
    setEmailError("")
    setPasswordError("")
    setGeneralError("")
    setInfoMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (!email.trim()) {
      setEmailError("Email is required")
      return
    }
    if (!password) {
      setPasswordError("Password is required")
      return
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          if (error.message.toLowerCase().includes("email")) {
            setEmailError(error.message)
          } else if (
            error.message.toLowerCase().includes("password") ||
            error.message.toLowerCase().includes("credential")
          ) {
            setPasswordError(error.message)
          } else {
            setGeneralError(error.message)
          }
        } else {
          router.push("/pick")
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/pick`,
          },
        })

        if (error) {
          if (error.message.toLowerCase().includes("email")) {
            setEmailError(error.message)
          } else if (error.message.toLowerCase().includes("password")) {
            setPasswordError(error.message)
          } else {
            setGeneralError(error.message)
          }
        } else if (data.session) {
          router.push("/pick")
          router.refresh()
        } else {
          setInfoMessage(
            "Account created! Please check your email to confirm your account or sign in."
          )
          setMode("signin")
        }
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    clearErrors()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/pick`,
        },
      })
      if (error) {
        setGeneralError(error.message)
        setLoading(false)
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to initiate Google sign in.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-[#0A0A0A] antialiased">
      {/* ── CENTERED CARD ──────────────────────────────────────────────── */}
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-none sm:rounded-[4px] p-8 sm:p-10 shadow-none">
        {/* LENS Logo at top */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link
            href="/"
            className="font-pixel text-sm tracking-[0.25em] text-black/70 hover:text-black transition-colors mb-3"
          >
            LENS
          </Link>
          <h1 className="text-2xl font-light text-[#0A0A0A] tracking-tight">
            {mode === "signin" ? "Sign in to Lens" : "Create your account"}
          </h1>
        </div>

        {/* Toggle between "Sign in" and "Create account" (plain text links, no tabs) */}
        <div className="flex items-center justify-center gap-4 text-xs tracking-wider mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              clearErrors()
            }}
            className={`transition-colors uppercase text-xs tracking-widest ${
              mode === "signin"
                ? "text-[#0A0A0A] font-semibold underline underline-offset-4"
                : "text-[#6B7280] hover:text-[#0A0A0A]"
            }`}
          >
            Sign in
          </button>
          <span className="text-[#E5E5E5]">•</span>
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              clearErrors()
            }}
            className={`transition-colors uppercase text-xs tracking-widest ${
              mode === "signup"
                ? "text-[#0A0A0A] font-semibold underline underline-offset-4"
                : "text-[#6B7280] hover:text-[#0A0A0A]"
            }`}
          >
            Create account
          </button>
        </div>

        {generalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-none">
            {generalError}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-[#F5F5F0] border border-[#E5E5E5] text-xs text-[#0A0A0A] rounded-none">
            {infoMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError("")
              }}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full border border-[#E5E5E5] bg-white p-[12px] text-sm text-[#0A0A0A] placeholder:text-[#6B7280] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
            />
            {emailError && (
              <p className="text-xs text-red-600 mt-1.5">{emailError}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError("")
              }}
              placeholder="Password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
              className="w-full border border-[#E5E5E5] bg-white p-[12px] text-sm text-[#0A0A0A] placeholder:text-[#6B7280] focus:border-[#0A0A0A] focus:outline-none rounded-none transition-colors"
            />
            {passwordError && (
              <p className="text-xs text-red-600 mt-1.5">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A0A0A] text-white py-3 text-xs uppercase tracking-widest font-medium rounded-none hover:bg-black/90 disabled:opacity-50 transition-colors"
          >
            {loading
              ? "PLEASE WAIT..."
              : mode === "signin"
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Divider line with "or" text */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E5E5]" />
          </div>
          <span className="relative bg-white px-3 text-xs text-[#6B7280] uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-[#0A0A0A] text-[#0A0A0A] py-3 text-xs uppercase tracking-widest font-medium rounded-none hover:bg-black/[0.04] disabled:opacity-50 transition-colors"
        >
          CONTINUE WITH GOOGLE
        </button>
      </div>
    </div>
  )
}

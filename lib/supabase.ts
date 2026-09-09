import { createBrowserClient, createServerClient } from "@supabase/ssr"

function getValidSupabaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) {
    return "https://placeholder-project.supabase.co"
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }
  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return "https://placeholder-project.supabase.co"
  }
}

function getValidSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return key && key.length > 0 ? key : "placeholder-anon-key"
}

export const supabaseUrl = getValidSupabaseUrl()
export const supabaseAnonKey = getValidSupabaseAnonKey()

export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export async function createServerComponentClient(context?: { cookies?: any }) {
  let cookieStore: any

  if (context?.cookies) {
    cookieStore =
      typeof context.cookies === "function"
        ? await context.cookies()
        : await context.cookies
  } else {
    const { cookies } = await import("next/headers")
    cookieStore = await cookies()
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignored if in Server Component
        }
      },
    },
  })
}

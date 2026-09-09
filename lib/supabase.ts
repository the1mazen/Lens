import { createBrowserClient, createServerClient } from "@supabase/ssr"

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

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
          // Can be ignored if handled in middleware or server component
        }
      },
    },
  })
}

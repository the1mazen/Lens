import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { getRoleById, roles } from "@/lib/roles"
import { ChatClient } from "@/components/chat-client"
import { createServerComponentClient } from "@/lib/supabase"

interface ChatPageProps {
  params: Promise<{
    roleId: string
  }>
}

export async function generateStaticParams() {
  return roles.map((role) => ({
    roleId: role.id,
  }))
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { roleId } = await params
  const role = getRoleById(roleId)

  if (!role) {
    return {
      title: "Expert Chat — Lens",
    }
  }

  return {
    title: `${role.name} ${role.emoji} — Lens`,
    description: role.tagline,
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { roleId } = await params
  const role = getRoleById(roleId)

  if (!role) {
    notFound()
  }

  return <ChatClient role={role} />
}

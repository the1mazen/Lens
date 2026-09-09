import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET /api/admin/knowledge?roleId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get("roleId")

    const supabase = await createServerComponentClient()

    let query = supabase
      .from("expert_knowledge")
      .select("*")
      .order("created_at", { ascending: false })

    if (roleId && roleId !== "all") {
      query = query.or(`role_id.eq.${roleId},role_id.eq.*`)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist yet
        return NextResponse.json({
          knowledge: [],
          tableNotCreated: true,
          message: "The 'expert_knowledge' table has not been created in Supabase yet.",
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ knowledge: data ?? [] })
  } catch (err: any) {
    console.error("GET /api/admin/knowledge error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch knowledge" },
      { status: 500 }
    )
  }
}

// POST /api/admin/knowledge
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roleId, title, rule } = body

    if (!roleId || !title?.trim() || !rule?.trim()) {
      return NextResponse.json(
        { error: "roleId, title, and rule are required" },
        { status: 400 }
      )
    }

    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("expert_knowledge")
      .insert([
        {
          role_id: roleId.trim(),
          title: title.trim(),
          rule: rule.trim(),
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Please create the 'expert_knowledge' table in your Supabase SQL Editor first.",
            tableNotCreated: true,
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ knowledge: data }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/admin/knowledge error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to save knowledge" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/knowledge (toggle is_active)
export async function PATCH(request: Request) {
  try {
    const { id, is_active } = await request.json()

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "id and boolean is_active are required" },
        { status: 400 }
      )
    }

    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("expert_knowledge")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ knowledge: data })
  } catch (err: any) {
    console.error("PATCH /api/admin/knowledge error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to update knowledge" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/knowledge?id=...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const supabase = await createServerComponentClient()

    const { error } = await supabase
      .from("expert_knowledge")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("DELETE /api/admin/knowledge error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to delete knowledge" },
      { status: 500 }
    )
  }
}

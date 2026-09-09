import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { getRoleById } from "@/lib/roles";
import { createServerComponentClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages, roleId } = await req.json();

    const role = getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const apiKey = process.env.GROQ_API_KEY || "";
    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured");
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    let systemPrompt = role.systemPrompt;

    // Fetch active learned knowledge from Supabase (specific role or global '*')
    try {
      const supabase = await createServerComponentClient();
      const { data: knowledge } = await supabase
        .from("expert_knowledge")
        .select("rule, title")
        .eq("is_active", true)
        .or(`role_id.eq.${roleId},role_id.eq.*`);

      if (knowledge && knowledge.length > 0) {
        systemPrompt +=
          `\n\n### LEARNED DOMAIN KNOWLEDGE & EXPERT GUIDELINES (You MUST follow these rules at all times):\n` +
          knowledge
            .map((k, index) => `${index + 1}. [${k.title}]: ${k.rule}`)
            .join("\n");
      }
    } catch (dbErr) {
      console.warn(
        "Could not fetch expert knowledge, proceeding with base system prompt:",
        dbErr
      );
    }

    const groq = createGroq({ apiKey });

    const result = streamText({
      model: groq("openai/gpt-oss-120b"),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err: any) => err?.message ?? "An error occurred",
    });
  } catch (error: any) {
    if (
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.code === "rate_limit_exceeded" ||
      error?.message?.includes("429") ||
      error?.message?.toLowerCase().includes("rate limit")
    ) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

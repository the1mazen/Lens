import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { getRoleById } from "@/lib/roles";

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

    const groq = createGroq({ apiKey });

    const result = streamText({
      model: groq("openai/gpt-oss-120b"),
      system: role.systemPrompt,
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

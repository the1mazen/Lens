import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { getRoleById } from "@/lib/roles";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, roleId } = await req.json();

    const role = getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const result = streamText({
      model: groq("llama-3.1-70b-versatile"),
      system: role.systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
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

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  let userMessage = "";
  try {
    const body = await req.json();
    userMessage = body.userMessage ?? "";
    const roleName = body.roleName ?? "";

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a prompt engineer. Rewrite the user's casual message into a clear, structured instruction for an AI expert named ${roleName}. Rules: keep the user's intent exactly, add context about what kind of response would be most helpful, keep it under 3 sentences, output ONLY the rewritten prompt with no preamble.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const augmentedPrompt =
      completion.choices[0]?.message?.content?.trim() || userMessage;

    return NextResponse.json({ augmentedPrompt });
  } catch (error: any) {
    if (
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.code === "rate_limit_exceeded" ||
      error?.message?.includes("429") ||
      error?.message?.toLowerCase().includes("rate limit")
    ) {
      return NextResponse.json({ augmentedPrompt: userMessage });
    }

    console.error("Error in /api/augment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

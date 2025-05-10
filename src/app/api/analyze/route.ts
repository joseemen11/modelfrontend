import { NextRequest, NextResponse } from "next/server";

const MOODS = ["Feliz 😀", "Triste 😢", "Neutral 😐"];

export async function POST(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 1200));

  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  return NextResponse.json({ mood });
}

import { NextResponse } from "next/server";
import { buildExperience, getExperienceStatus } from "@/services/experience/experience-engine";
import type { SceneId } from "@/lib/parisVisualizationData";

type ChatRequestBody = {
  message?: string;
  currentSceneId?: SceneId;
};

export async function GET() {
  const status = await getExperienceStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const experience = await buildExperience({
      message,
      currentSceneId: body.currentSceneId
    });

    return NextResponse.json(experience);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Experience query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

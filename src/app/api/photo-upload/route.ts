import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Wirft, falls niemand eingeloggt ist - verhindert, dass Fremde
        // sich einen Upload-Token für unseren Blob-Speicher holen.
        await requireUser();
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload fehlgeschlagen." },
      { status: 400 }
    );
  }
}

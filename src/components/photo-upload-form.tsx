"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createPhotoDocEntry } from "@/actions/docs";

export function PhotoUploadForm({
  projectId,
  redirectTo,
}: {
  projectId: number;
  redirectTo: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/photo-upload",
      });
      await createPhotoDocEntry(projectId, blob.url, textInputRef.current?.value || null);
      router.push(`${redirectTo}?saved=1`);
      router.refresh();
    } catch {
      setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        name="photo"
        accept="image/*"
        capture="environment"
        required
        className="text-sm text-silver file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-2 file:text-xs file:font-medium file:text-background hover:file:bg-copper-light"
      />
      <input
        ref={textInputRef}
        name="text"
        placeholder="Bildunterschrift (optional)"
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={uploading}
        className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light disabled:opacity-60"
      >
        {uploading ? "Wird hochgeladen…" : "Hochladen"}
      </button>
    </form>
  );
}

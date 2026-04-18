import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured.");
  return createClient(url, key);
}

// Verify actual file bytes rather than the client-supplied MIME type.
function detectDocMime(buf: Uint8Array): { mime: string; ext: string } | null {
  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)
    return { mime: "application/pdf", ext: "pdf" };
  // DOCX / Office Open XML (PK zip header)
  if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04)
    return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" };
  // Legacy DOC (Compound Document: D0 CF 11 E0)
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0)
    return { mime: "application/msword", ext: "doc" };
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return { mime: "image/png", ext: "png" };
  // WebP (RIFF....WEBP)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50)
    return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const detected = detectDocMime(buffer);
  if (!detected) {
    return NextResponse.json(
      { error: "Only PDF, Word documents, and images are allowed" },
      { status: 400 }
    );
  }

  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 60);
  const fileName = `${session.user.id}/vendor-docs/${Date.now()}-${safeName}.${detected.ext}`;

  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from("wedding-photos")
    .upload(fileName, buffer, {
      contentType: detected.mime,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("wedding-photos").getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}

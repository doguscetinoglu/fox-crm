import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "text/plain",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Dosya 10 MB'dan büyük olamaz" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Desteklenmeyen dosya tipi" }, { status: 400 });

  const blob = await put(`ticket-replies/${Date.now()}-${file.name}`, file, { access: "public" });

  return NextResponse.json({
    url: blob.url,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}

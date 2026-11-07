// src/app/api/announcements/files/[id]/route.ts
// GET /api/announcements/files/<id>             → opens the file in the browser (PDF / image)
// GET /api/announcements/files/<id>?download=1  → downloads it with its original name

import { readFile } from "fs/promises";
import path from "path";
import { FILES_DIR, FILE_TYPES } from "../storage";

export const runtime = "nodejs";

// Only ids created by the upload route are accepted (no "../" tricks).
const VALID_ID = /^[0-9a-f-]{36}\.(pdf|docx?|jpe?g|png|webp)$/i;

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!VALID_ID.test(id)) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(path.join(FILES_DIR, id));
  } catch {
    return new Response("File not found", { status: 404 });
  }

  let name = id;
  try {
    name = JSON.parse(await readFile(path.join(FILES_DIR, `${id}.json`), "utf8")).name || id;
  } catch {
    /* metadata missing: fall back to the id */
  }

  const ext = id.split(".").pop()!.toLowerCase();
  const download = new URL(req.url).searchParams.has("download");
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": FILE_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

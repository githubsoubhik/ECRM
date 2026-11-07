// src/app/api/announcements/files/route.ts
// GET  /api/announcements/files  → quick check: open it in the browser, it should show {"ok":true,...}
// POST /api/announcements/files  (multipart form, field "file")
// Saves an announcement attachment in <project>/announcement-files and returns
// { id, name, size, type, url }. The file is opened later via GET /api/announcements/files/<id>.

import { access, mkdir, writeFile } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { FILES_DIR, FILE_TYPES, MAX_BYTES } from "./storage";

export const runtime = "nodejs";

const json = (data: unknown, status = 200) => Response.json(data, { status });

// Health check — if this shows ok:true, uploads will work.
export async function GET() {
  try {
    await mkdir(FILES_DIR, { recursive: true });
    await access(FILES_DIR, constants.W_OK);
    return json({ ok: true, message: "Announcement file uploads are working.", folder: FILES_DIR });
  } catch (e) {
    return json({ ok: false, message: "The upload folder can't be written to.", folder: FILES_DIR, error: String(e) }, 500);
  }
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Send the file as multipart/form-data." }, 400);
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return json({ error: "No file received." }, 400);

  const name = (file.name || "file").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 150);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!FILE_TYPES[ext]) return json({ error: "Only PDF, DOC, DOCX, JPG, PNG or WEBP files are allowed." }, 415);
  if (file.size > MAX_BYTES) return json({ error: "File is larger than 10 MB." }, 413);

  const id = `${randomUUID()}.${ext}`;
  const meta = { id, name, size: file.size, type: FILE_TYPES[ext], uploadedAt: new Date().toISOString() };
  try {
    await mkdir(FILES_DIR, { recursive: true });
    await writeFile(path.join(FILES_DIR, id), Buffer.from(await file.arrayBuffer()));
    await writeFile(path.join(FILES_DIR, `${id}.json`), JSON.stringify(meta));
  } catch {
    return json({ error: "Could not save the file on the server." }, 500);
  }
  return json({ id, name, size: file.size, type: meta.type, url: `/api/announcements/files/${id}` }, 201);
}

// src/app/api/announcements/files/storage.ts
// Where announcement attachments are saved, and which file types are allowed.
// (Kept out of route.ts because Next.js only allows GET/POST/... exports there.)

import path from "path";

// <project root>/announcement-files — next to your attendance-photos folder.
export const FILES_DIR = path.join(process.cwd(), "announcement-files");

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (same limit as the form)

// Allowed extensions and the content type each is served with.
export const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

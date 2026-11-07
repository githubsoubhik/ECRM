import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  const { photo, name } = await req.json();

  // Accept only a JPEG/PNG image from the camera
  const match = typeof photo === 'string' && photo.match(/^data:image\/(jpeg|png);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  }

  // Photos go to: pavion_crm/attendance-photos/
  const folder = path.join(process.cwd(), 'attendance-photos');
  await mkdir(folder, { recursive: true });

  const safeName = String(name || 'photo').replace(/[^A-Za-z0-9_-]/g, '');
  const fileName = `${safeName}_${Date.now()}.${match[1] === 'jpeg' ? 'jpg' : 'png'}`;

  await writeFile(path.join(folder, fileName), Buffer.from(match[2], 'base64'));

  return NextResponse.json({ fileName });
}   
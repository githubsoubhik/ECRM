// Path: src/app/api/client-onboarding/route.ts
// Validates the onboarding form and stores ONLY the attached logo file
// in public/uploads/client-logos/ (same idea as announcement attachments).
// Form fields (including passwords) are NOT written to disk.
// No .env.local or extra setup needed.

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  initialFormData,
  validateOnboarding,
  type OnboardingFormData,
} from "../../data/clientOnboardingData";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const data = { ...initialFormData };
    (Object.keys(initialFormData) as (keyof OnboardingFormData)[]).forEach((k) => {
      const v = fd.get(k);
      data[k] = typeof v === "string" ? v.trim() : "";
    });

    const logoEntry = fd.get("companyLogo");
    const logo = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;

    const errors = validateOnboarding(data, logo ? { type: logo.type, size: logo.size } : null);
    if (Object.keys(errors).length) {
      return NextResponse.json({ message: "Please fix the highlighted fields.", errors }, { status: 400 });
    }

    const id = `CLT-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;

    // Save only the attachment
    let logoUrl = "";
    if (logo) {
      const ext = logo.type === "image/svg+xml" ? "svg" : logo.type === "image/png" ? "png" : "jpg";
      const dir = path.join(process.cwd(), "public", "uploads", "client-logos");
      await mkdir(dir, { recursive: true });
      const fileName = `${id}.${ext}`;
      await writeFile(path.join(dir, fileName), Buffer.from(await logo.arrayBuffer()));
      logoUrl = `/uploads/client-logos/${fileName}`;
    }

    return NextResponse.json(
      { id, logoUrl, fileName: logo?.name ?? "", message: "Client onboarded successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[client-onboarding]", error);
    return NextResponse.json({ message: "Could not submit the form. Please try again." }, { status: 500 });
  }
}

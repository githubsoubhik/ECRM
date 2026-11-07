"use client";

// "Logo / Symbol" column next to Attach Files.
// • Choose Symbol → a built-in icon, shown on the announcement card (no cover image).
// • Upload Logo   → the image is shown on the card AND, at full size, as the cover
//                   (banner) at the top of the announcement's notice page.

import { useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Shapes, Trash2, Upload } from "lucide-react";
import { AnnouncementLogo, Glyph, SYMBOLS, defaultSymbol, symbolDef } from "../../../components/announcements/AnnouncementLogo";
import type { AnnouncementLogo as Logo, AttachmentMeta } from "../../../../data/announcementData";
import { uploadFile } from "../../../../data/announcementFiles";
import { FileImage } from "../../../components/announcements/FileSource";
import { cx } from "./ui";
import styles from "../announcement.module.css";

const MAX_LOGO_BYTES = 10 * 1024 * 1024; // 10 MB (same as attachments)
const LOGO_PX = 256; // card tile size (longest side)
const COVER_MAX_PX = 2000; // SVG/GIF logos are turned into a PNG this big for the cover
const UPLOADABLE = ["image/png", "image/jpeg", "image/webp"]; // sent to the server as they are
const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];

// Draws the image onto a canvas no bigger than maxPx (keeps transparency).
function drawImage(file: File, maxPx: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || maxPx;
      const h = img.naturalHeight || maxPx;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

// The full-size file used as the cover: the original for PNG/JPG/WEBP, a PNG copy for SVG/GIF.
async function coverFileFor(file: File): Promise<File> {
  if (UPLOADABLE.includes(file.type)) return file;
  const canvas = await drawImage(file, COVER_MAX_PX);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("convert");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
}

export default function LogoPicker({
  value,
  cover,
  onChange,
  onBusy,
  category,
  urgent,
}: {
  value: Logo | null;
  /** Full-size copy of an uploaded logo, used as the notice page cover. */
  cover: AttachmentMeta | null;
  /** Called once the logo (and its cover upload) is ready. */
  onChange: (logo: Logo | null, cover: AttachmentMeta | null) => void;
  onBusy?: (busy: boolean) => void;
  category: string;
  urgent: boolean;
}) {
  const [mode, setMode] = useState<"upload" | "symbol">(value?.kind === "image" ? "upload" : "symbol");
  const [error, setError] = useState("");
  const [busy, setBusyState] = useState(false);
  const [warning, setWarning] = useState("");
  const setBusy = (b: boolean) => {
    setBusyState(b);
    onBusy?.(b);
  };
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    if (!LOGO_TYPES.includes(f.type)) return setError("Use a PNG, JPG, SVG, WEBP or GIF image.");
    if (f.size > MAX_LOGO_BYTES) return setError("Logo must be 10 MB or smaller.");
    setBusy(true);
    setWarning("");
    try {
      const tile = (await drawImage(f, LOGO_PX)).toDataURL("image/png");
      // Full-size copy for the cover. If it can't be saved, the logo still works on the card.
      let full: AttachmentMeta | null = null;
      try {
        const res = await uploadFile(await coverFileFor(f));
        full = res.file;
        if (res.warning) setWarning(res.warning);
      } catch (e) {
        setWarning(`Logo added, but the cover image couldn't be saved: ${(e as Error).message}`);
      }
      onChange({ kind: "image", dataUrl: tile, name: f.name }, full);
      setError("");
    } catch {
      setError("Couldn't read this image. Try another file.");
    } finally {
      setBusy(false);
    }
  };

  const selectedSymbol = value?.kind === "symbol" ? value.symbol : null;
  const caption =
    value?.kind === "image"
      ? value.name
      : value?.kind === "symbol"
        ? symbolDef(value.symbol).label
        : `Automatic · ${symbolDef(defaultSymbol(category, urgent)).label}`;

  return (
    <div className={styles.logoPicker}>
      <div className={styles.logoPreview}>
        <AnnouncementLogo logo={value} category={category} urgent={urgent} size={52} />
        <span>
          <b>{value ? "Selected" : "Default"}</b>
          <small title={caption}>{caption}</small>
        </span>
        {value && (
          <button type="button" className={styles.logoRemove} onClick={() => onChange(null, null)} aria-label="Remove logo">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className={styles.logoTabs} role="tablist" aria-label="Logo source">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "symbol"}
          className={cx(mode === "symbol" && styles.logoTabOn)}
          onClick={() => setMode("symbol")}
        >
          <Shapes size={15} /> Choose Symbol
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "upload"}
          className={cx(mode === "upload" && styles.logoTabOn)}
          onClick={() => setMode("upload")}
        >
          <ImagePlus size={15} /> Upload Logo
        </button>
      </div>

      {mode === "symbol" ? (
        <div className={styles.symbolGrid} role="listbox" aria-label="Symbols">
          {SYMBOLS.map((s) => {
            const on = selectedSymbol === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="option"
                aria-selected={on}
                title={s.label}
                aria-label={s.label}
                className={cx(styles.symbolBtn, on && styles.symbolOn)}
                style={{ background: s.soft }}
                onClick={() => onChange(on ? null : { kind: "symbol", symbol: s.key }, null)}
              >
                <Glyph def={s} size={19} />
                {on && (
                  <em>
                    <Check size={10} strokeWidth={3.5} />
                  </em>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={cx(styles.logoDrop, drag && styles.dropOn)}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pickFile(e.dataTransfer.files);
          }}
        >
          {busy ? <Loader2 size={20} className={styles.spin} /> : <Upload size={20} />}
          <span>
            <b>{busy ? "Uploading…" : value?.kind === "image" ? "Replace logo" : "Upload logo or image"}</b>
            <small>PNG, JPG, SVG, WEBP (Max 10 MB) · also used as the cover image</small>
          </span>
          <input ref={fileRef} type="file" hidden accept={LOGO_TYPES.join(",")} onChange={(e) => pickFile(e.target.files)} />
        </div>
      )}
      {value?.kind === "image" && cover && (
        <div className={styles.coverMini}>
          <FileImage file={cover} alt="Cover image preview" />
          <small>Cover image on the announcement page</small>
        </div>
      )}
      {warning && (
        <span className={styles.fieldWarn}>
          <AlertTriangle size={14} /> {warning}
        </span>
      )}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

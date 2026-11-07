"use client";

// src/app/components/announcements/FileSource.tsx
// Shows / opens / downloads an announcement file whether it was saved on the server
// (/api/announcements/files/<id>) or kept in this browser ("local:<id>", see data/announcementFiles.ts).

import { useEffect, useState, type AnchorHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from "react";
import type { AttachmentMeta } from "../../../data/announcementData";
import { isLocalUrl, resolveFileUrl } from "../../../data/announcementFiles";

/**
 * The address to use in <img src> / <a href>.
 *   undefined → still loading (browser-stored file) or no url
 *   null      → the file isn't available (e.g. it was stored in another browser)
 */
export function useFileSrc(url?: string): string | null | undefined {
  const [loaded, setLoaded] = useState<{ url: string; src: string | null } | null>(null);
  useEffect(() => {
    if (!url || !isLocalUrl(url)) return;
    let alive = true;
    resolveFileUrl(url).then((src) => alive && setLoaded({ url, src }));
    return () => {
      alive = false;
    };
  }, [url]);
  if (!url) return undefined;
  if (!isLocalUrl(url)) return url;
  return loaded?.url === url ? loaded.src : undefined;
}

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "download">;

/** Link that downloads the file with its original name. */
export function FileDownload({ file, children, ...rest }: { file: AttachmentMeta; children: ReactNode } & AnchorProps) {
  const src = useFileSrc(file.url);
  if (!src) {
    return (
      <span {...(rest as object)} aria-disabled="true" title={src === null ? "File not available in this browser" : "Preparing…"} data-disabled="true">
        {children}
      </span>
    );
  }
  // Server files: ?download=1 makes the server send it as a download with the right name.
  const inBrowser = isLocalUrl(file.url) || src.startsWith("data:") || src.startsWith("blob:");
  return inBrowser ? (
    <a {...rest} href={src} download={file.name}>
      {children}
    </a>
  ) : (
    <a {...rest} href={`${src}?download=1`}>
      {children}
    </a>
  );
}

/** Link that opens the file in a new tab. */
export function FileOpen({ file, children, ...rest }: { file: AttachmentMeta; children: ReactNode } & AnchorProps) {
  const src = useFileSrc(file.url);
  if (!src) return null;
  return (
    <a {...rest} href={src} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** <img> for an uploaded image. Calls onMissing when it can't be shown. */
export function FileImage({ file, onMissing, ...rest }: { file: AttachmentMeta; onMissing?: () => void } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const src = useFileSrc(file.url);
  useEffect(() => {
    if (src === null) onMissing?.();
  }, [src, onMissing]);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} src={src} onError={() => onMissing?.()} />;
}

/** Built-in browser PDF viewer. */
export function FileFrame({ file, ...rest }: { file: AttachmentMeta; className?: string; title: string }) {
  const src = useFileSrc(file.url);
  if (!src) return null;
  return <iframe {...rest} src={src} />;
}

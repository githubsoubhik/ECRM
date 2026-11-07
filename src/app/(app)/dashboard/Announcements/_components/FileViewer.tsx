"use client";

// Opens an announcement attachment inside the page:
//   images → shown directly, PDFs → built-in PDF viewer, Word files → download.
// Files come from GET /api/announcements/files/<id> (see src/app/api/announcements/files).

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileWarning } from "lucide-react";
import { fmtSize, isImageFile, isPdfFile, type AttachmentMeta } from "../../../../data/announcementData";
import { FileDownload, FileFrame, FileImage, FileOpen } from "../../../components/announcements/FileSource";
import { FileBadge } from "./AnnouncementCard";
import { Dialog } from "./ui";
import styles from "../announcements.module.css";

export default function FileViewer({
  files,
  index,
  onIndex,
  onClose,
}: {
  files: AttachmentMeta[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const f = files[index];
  const [failed, setFailed] = useState<string | null>(null); // url that failed to load
  const url = f?.url;
  const markFailed = useCallback(() => setFailed(url ?? null), [url]);
  if (!f) return null;
  const broken = failed === f.url;
  const kind = !f.url ? "missing" : broken ? "error" : isImageFile(f) ? "image" : isPdfFile(f) ? "pdf" : "other";

  return (
    <Dialog
      label={f.name}
      onClose={onClose}
      wide
      className={styles.viewerDialog}
      header={
        <div className={styles.viewerHead}>
          <FileBadge name={f.name} />
          <span>
            <b title={f.name}>{f.name}</b>
            <small>
              {fmtSize(f.size)}
              {files.length > 1 && ` · File ${index + 1} of ${files.length}`}
            </small>
          </span>
        </div>
      }
      footer={
        <>
          {files.length > 1 && (
            <>
              <button className={styles.ghostBtn} onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Previous file">
                <ChevronLeft size={16} />
              </button>
              <button className={styles.ghostBtn} onClick={() => onIndex(index + 1)} disabled={index === files.length - 1} aria-label="Next file">
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <span className={styles.flexSpacer} />
          {f.url && !broken && (
            <>
              <FileOpen file={f} className={styles.ghostBtn}>
                <ExternalLink size={16} /> <span className={styles.hideXs}>Open in new tab</span>
              </FileOpen>
              <FileDownload file={f} className={styles.applyBtn}>
                <Download size={16} /> Download
              </FileDownload>
            </>
          )}
        </>
      }
    >
      <div className={styles.viewerStage}>
        {kind === "image" && <FileImage key={f.url} file={f} alt={f.name} className={styles.viewerImg} onMissing={markFailed} />}
        {kind === "pdf" && <FileFrame key={f.url} file={f} title={f.name} className={styles.viewerPdf} />}
        {kind === "other" && <Message title="Preview isn't available for Word files" text="Download the file to open it in Microsoft Word or Google Docs." />}
        {kind === "missing" && (
          <Message
            title="This file wasn't uploaded"
            text="It's sample data, or it was attached before file uploads were turned on. Ask the sender to attach it again."
          />
        )}
        {kind === "error" && (
          <Message title="The file couldn't be loaded" text="It may have been removed, or it was saved in another browser. Ask the sender to share it again." />
        )}
      </div>
      {kind === "pdf" && <p className={styles.viewerHint}>PDF not showing on your phone? Use “Open in new tab” or “Download”.</p>}
    </Dialog>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.viewerMsg}>
      <FileWarning size={34} />
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

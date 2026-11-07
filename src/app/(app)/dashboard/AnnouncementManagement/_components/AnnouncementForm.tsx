"use client";

// "Create New Announcement" form.

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock,
  FileText,
  FileImage,
  File as FileIcon,
  Image as ImageIcon,
  ExternalLink,
  Info,
  Loader2,
  LayoutList,
  MessageSquareText,
  Paperclip,
  Pin,
  Save,
  Send,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  autoCategory,
  categoryLabel,
  categoryOptions,
  fmtSize,
  type AnnouncementInput,
  type AttachmentMeta,
  type Person,
} from "../../../../data/announcementData";
import { uploadFile } from "../../../../data/announcementFiles";
import { FileOpen } from "../../../components/announcements/FileSource";
import AudiencePicker from "./AudiencePicker";
import LogoPicker from "./LogoPicker";
import RichTextEditor from "./RichTextEditor";
import { DateField, cx } from "./ui";
import styles from "../announcement.module.css";

export type FormErrors = Partial<Record<keyof AnnouncementInput | "audience" | "files", string>>;

const fileIcon = (a: AttachmentMeta) => (a.type.startsWith("image/") ? FileImage : /pdf|word|document/.test(a.type) ? FileText : FileIcon);

export default function AnnouncementForm({
  input,
  onChange,
  errors,
  editorKey,
  list,
  isMobile,
  today,
  onSend,
  onCancel,
  onSaveDraft,
  onAddAttachments,
  onLogo,
}: {
  input: AnnouncementInput;
  onChange: (next: AnnouncementInput, touched?: keyof FormErrors) => void;
  errors: FormErrors;
  editorKey: string;
  list: Person[];
  isMobile: boolean;
  today: string;
  onSend: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  /** Adds uploaded files (called when each upload finishes, so it must not use a stale form copy). */
  onAddAttachments: (files: AttachmentMeta[]) => void;
  /** Sets the logo and its full-size cover copy (called after the upload finishes). */
  onLogo: (logo: AnnouncementInput["logo"], cover: AttachmentMeta | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState<{ key: string; name: string; size: number }[]>([]);
  const [fileNote, setFileNote] = useState(""); // server upload failed → kept in browser
  const [logoBusy, setLogoBusy] = useState(false);
  const busy = uploading.length > 0 || logoBusy;

  const set = <K extends keyof AnnouncementInput>(key: K, value: AnnouncementInput[K]) => onChange({ ...input, [key]: value }, key);

  // Each file is uploaded to the server (src/app/api/announcements/files) so employees can open it later.
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const problems: string[] = [];
    const taken = (f: File) => [...input.attachments, ...uploading].some((a) => a.name === f.name && a.size === f.size);
    const batch: { key: string; file: File }[] = [];
    [...files].forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) return problems.push(`${f.name}: only PDF, DOC, DOCX, JPG or PNG.`);
      if (f.size > MAX_FILE_BYTES) return problems.push(`${f.name}: larger than 10 MB.`);
      if (taken(f) || batch.some((b) => b.file.name === f.name && b.file.size === f.size)) return;
      batch.push({ key: `${f.name}-${f.size}-${Math.random()}`, file: f });
    });
    setFileError(problems.join(" "));
    if (fileRef.current) fileRef.current.value = "";
    if (!batch.length) return;

    // Upload together, then add in the order they were picked
    // (the first image becomes the banner on the notice page).
    setUploading((u) => [...u, ...batch.map((b) => ({ key: b.key, name: b.file.name, size: b.file.size }))]);
    Promise.allSettled(batch.map((b) => uploadFile(b.file))).then((results) => {
      const done: AttachmentMeta[] = [];
      const failed: string[] = [];
      let warning = "";
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          done.push(r.value.file);
          if (r.value.warning) warning = r.value.warning;
        } else failed.push(`${batch[i].file.name}: ${(r.reason as Error).message}`);
      });
      setFileNote(warning);
      if (done.length) onAddAttachments(done);
      if (failed.length) setFileError((prev) => [prev, ...failed].filter(Boolean).join(" "));
      setUploading((u) => u.filter((x) => !batch.some((b) => b.key === x.key)));
    });
  };

  const err = (k: keyof FormErrors) => (errors[k] ? <span className={styles.fieldError}>{errors[k]}</span> : null);

  const period = (
    <section className={cx(styles.periodBox, (errors.startDate || errors.endDate) && styles.boxInvalid)}>
      <h3 className={styles.label}>
        <CalendarDays size={17} /> Announcement Active Period <b>*</b>
      </h3>
      <div className={styles.periodGrid}>
        <div className={styles.field}>
          <span className={styles.subLabel}>Start Date</span>
          <DateField
            value={input.startDate}
            onChange={(v) => set("startDate", v)}
            placeholder="Select start date"
            min={today}
            invalid={!!errors.startDate}
            ariaLabel="Start date"
          />
          {err("startDate")}
        </div>
        <div className={styles.field}>
          <span className={styles.subLabel}>End Date</span>
          <DateField
            value={input.endDate}
            onChange={(v) => set("endDate", v)}
            placeholder="Select end date"
            min={input.startDate || today}
            invalid={!!errors.endDate}
            ariaLabel="End date"
          />
          {err("endDate")}
        </div>
        <p className={styles.periodNote}>
          <Info size={15} /> The announcement will be visible to selected audience between these dates.
        </p>
      </div>
    </section>
  );

  const schedule = (
    <section className={styles.schedule}>
      <h3 className={styles.label}>
        {isMobile && <Clock size={17} />} Schedule <b>*</b>
      </h3>
      <div className={styles.scheduleRow} role="radiogroup" aria-label="Schedule">
        {(
          [
            ["now", "Send Now"],
            ["later", "Schedule for Later"],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className={styles.inlineRadio}>
            <input type="radio" name="schedule" checked={input.schedule === v} onChange={() => set("schedule", v)} />
            <span className={styles.radio} aria-hidden="true" />
            {label}
          </label>
        ))}
      </div>
      <div className={cx(styles.whenRow, input.schedule === "now" && styles.whenDisabled, errors.sendDate && styles.boxInvalid)}>
        <label className={styles.whenPart}>
          <CalendarDays size={16} />
          <input
            type="date"
            value={input.sendDate}
            min={today}
            disabled={input.schedule === "now"}
            onChange={(e) => set("sendDate", e.target.value)}
            aria-label="Send date"
          />
        </label>
        <span className={styles.whenSep}>–</span>
        <label className={styles.whenPart}>
          <input
            type="time"
            value={input.sendTime}
            disabled={input.schedule === "now"}
            onChange={(e) => set("sendTime", e.target.value)}
            aria-label="Send time"
          />
        </label>
      </div>
      {err("sendDate")}
    </section>
  );

  // How it looks on the Announcements page: category tab, pin, urgent tag.
  const auto = autoCategory(input.audience);
  const display = (
    <section className={styles.displayOpts}>
      <h3 className={styles.label}>{isMobile && <LayoutList size={17} />} Display on Announcements Page</h3>
      <label className={styles.catSelect}>
        <span className={styles.subLabel}>Category</span>
        <span className={styles.select}>
          <select value={input.category} onChange={(e) => set("category", e.target.value)} aria-label="Category">
            <option value="">Automatic ({categoryLabel(auto)})</option>
            {categoryOptions(list).map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </span>
      </label>
      <div className={styles.toggleRow}>
        <label className={cx(styles.toggle, input.pinned && styles.toggleOn)}>
          <input type="checkbox" checked={input.pinned} onChange={(e) => set("pinned", e.target.checked)} />
          <Pin size={15} /> Pin to top
        </label>
        <label className={cx(styles.toggle, styles.toggleUrgent, input.urgent && styles.toggleOn)}>
          <input type="checkbox" checked={input.urgent} onChange={(e) => set("urgent", e.target.checked)} />
          <AlertTriangle size={15} /> Mark as urgent
        </label>
      </div>
    </section>
  );

  const actions = (
    <div className={cx(styles.formActions, isMobile && styles.stickyActions)}>
      {isMobile ? (
        <button type="button" className={styles.ghostBtn} onClick={onSaveDraft} disabled={busy}>
          <Save size={17} /> Save as Draft
        </button>
      ) : (
        <>
          <button type="button" className={styles.linkBtn} onClick={onSaveDraft} disabled={busy}>
            <Save size={15} /> Save as Draft
          </button>
          <button type="button" className={styles.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
      <button type="button" className={styles.primaryBtn} onClick={onSend} disabled={busy} title={busy ? "Wait for the files to finish uploading" : undefined}>
        {busy ? <Loader2 size={17} className={styles.spin} /> : <Send size={17} />}{" "}
        {busy ? "Uploading files…" : input.schedule === "later" ? "Schedule Announcement" : "Send Announcement"}
      </button>
    </div>
  );

  return (
    <section className={cx(styles.formCard, isMobile && styles.formFlat)} id="create-announcement" aria-labelledby="create-title">
      {!isMobile && (
        <header className={styles.formHead}>
          <h2 id="create-title">Create New Announcement</h2>
          <p>Share important updates, policies, events or information with your employees</p>
        </header>
      )}
      <div className={styles.formGrid}>
        <div className={styles.formLeft}>
          <label className={styles.field}>
            <span className={styles.label}>
              {isMobile && <FileText size={17} />} Announcement Title <b>*</b>
            </span>
            <input
              id="announcement-title"
              className={cx(styles.input, errors.title && styles.invalid)}
              value={input.title}
              maxLength={120}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter announcement title"
            />
            {err("title")}
          </label>

          <div className={styles.field}>
            <span className={styles.label}>
              {isMobile && <MessageSquareText size={17} />} Message <b>*</b>
            </span>
            <RichTextEditor
              key={editorKey}
              initialHtml={input.message}
              onChange={(html) => set("message", html)}
              placeholder="Write your announcement here..."
              invalid={!!errors.message}
            />
            {err("message")}
          </div>

          <div className={styles.attachRow}>
            <div className={styles.field}>
              <span className={styles.label}>
                <Paperclip size={17} /> Attach Files (Optional)
              </span>
              <div
                className={cx(styles.drop, drag && styles.dropOn)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              >
                {isMobile ? <UploadCloud size={26} /> : <Paperclip size={24} className={styles.dropClip} />}
                <span>
                  <b>
                    {isMobile ? "Tap to upload files" : "Drag & drop files here"} or <u>Browse</u>
                  </b>
                  <small>Supports PDF, DOC, DOCX, JPG, PNG (Max 10 MB)</small>
                </span>
                <input ref={fileRef} type="file" hidden multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => addFiles(e.target.files)} />
              </div>
              {fileError && <span className={styles.fieldError}>{fileError}</span>}
              {fileNote && (
                <span className={styles.fieldWarn}>
                  <AlertTriangle size={14} /> {fileNote}
                </span>
              )}
              {(input.attachments.length > 0 || busy) && (
                <ul className={styles.fileList}>
                  {input.attachments.map((a) => {
                    const Icon = fileIcon(a);
                    return (
                      <li key={a.id}>
                        <Icon size={17} />
                        <span title={a.name}>{a.name}</span>
                        <small>{fmtSize(a.size)}</small>
                        {a.url ? (
                          <FileOpen file={a} className={styles.fileOpen} aria-label={`Open ${a.name}`} title="Open file">
                            <ExternalLink size={14} />
                          </FileOpen>
                        ) : (
                          <em
                            className={styles.fileMissing}
                            title="This file was never uploaded (attached before uploads were enabled). Remove it and attach it again."
                          >
                            not uploaded
                          </em>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "attachments",
                              input.attachments.filter((x) => x.id !== a.id),
                            )
                          }
                          aria-label={`Remove ${a.name}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                  {uploading.map((u) => (
                    <li key={u.key} className={styles.fileUploading}>
                      <Loader2 size={17} className={styles.spin} />
                      <span title={u.name}>{u.name}</span>
                      <small>Uploading…</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                <ImageIcon size={17} /> Logo / Symbol (Optional)
              </span>
              <LogoPicker
                key={editorKey}
                value={input.logo}
                cover={input.cover}
                onChange={onLogo}
                onBusy={setLogoBusy}
                category={input.category || auto}
                urgent={input.urgent}
              />
            </div>
          </div>

          {period}
        </div>

        <div className={styles.formRight}>
          <div className={cx(styles.audienceBox, isMobile && styles.audienceFlat)}>
            <h3 className={styles.label}>
              {isMobile && <Users size={17} />} Target Audience <b>*</b>
            </h3>
            <AudiencePicker
              audience={input.audience}
              onChange={(a) => onChange({ ...input, audience: a }, "audience")}
              list={list}
              error={errors.audience}
              showChevrons={isMobile}
            />
            {!isMobile && schedule}
            {!isMobile && display}
          </div>
          {isMobile && schedule}
          {isMobile && display}
        </div>
      </div>
      {actions}
    </section>
  );
}

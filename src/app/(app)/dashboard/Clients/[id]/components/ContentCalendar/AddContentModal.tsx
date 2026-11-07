"use client";

// Add / Edit content form (centered modal on desktop, full-screen on mobile)
import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clapperboard,
  Clock,
  FileText,
  ImageIcon,
  LayoutGrid,
  MoreHorizontal,
  Send,
  ShoppingBag,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  CONTENT_TYPES,
  PLATFORMS,
  TAG_OPTIONS,
  type ContentPost,
  type ContentType,
  type MediaItem,
  type Platform,
} from "../../../../../../data/contentCalendarData";
import { PlatformIcon, Thumb, cx, readFilesAsMedia, useClickOutside, useEscape } from "./ccUi";

export type ModalState =
  | null
  | { mode: "add"; date: string; title?: string; ideaId?: string }
  | { mode: "edit"; post: ContentPost };

export interface ContentFormValues {
  title: string;
  type: ContentType;
  platforms: Platform[];
  date: string;
  time: string;
  caption: string;
  media: MediaItem[];
  tags: string[];
}

const TYPE_ICONS: Record<ContentType, LucideIcon> = {
  Image: ImageIcon,
  Reel: Clapperboard,
  Carousel: LayoutGrid,
  Story: FileText,
  Collection: ShoppingBag,
  Other: MoreHorizontal,
};

const TITLE_MAX = 100;
const CAPTION_MAX = 500;

interface Props {
  state: Exclude<ModalState, null>;
  onClose: () => void;
  onSave: (values: ContentFormValues, asDraft: boolean) => void;
}

export default function AddContentModal({ state, onClose, onSave }: Props) {
  const isEdit = state.mode === "edit";
  const [v, setV] = useState<ContentFormValues>(() =>
    state.mode === "edit"
      ? {
          title: state.post.title,
          type: state.post.type,
          platforms: [...state.post.platforms],
          date: state.post.date,
          time: state.post.time,
          caption: state.post.caption,
          media: [...state.post.media],
          tags: [...state.post.tags],
        }
      : {
          title: state.title ?? "",
          type: "Image",
          platforms: ["Instagram"],
          date: state.date,
          time: "11:30",
          caption: "",
          media: [],
          tags: [],
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const closeTags = useCallback(() => setTagsOpen(false), []);
  useClickOutside(tagRef, closeTags, tagsOpen);
  useEscape(onClose);

  const set = <K extends keyof ContentFormValues>(k: K, val: ContentFormValues[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const togglePlatform = (p: Platform) =>
    set("platforms", v.platforms.includes(p) ? v.platforms.filter((x) => x !== p) : [...v.platforms, p]);

  const toggleTag = (t: string) => set("tags", v.tags.includes(t) ? v.tags.filter((x) => x !== t) : [...v.tags, t]);

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || !("length" in files) || files.length === 0) return;
    const { media, rejected } = await readFilesAsMedia(files);
    setV((s) => ({ ...s, media: [...s.media, ...media] }));
    setErrors((e) => ({ ...e, media: rejected.length ? `Skipped (over 50MB): ${rejected.join(", ")}` : "" }));
  };

  const validate = (asDraft: boolean) => {
    const e: Record<string, string> = {};
    if (!v.title.trim()) e.title = "Content title is required";
    if (!v.date) e.date = "Pick a date";
    if (!asDraft) {
      if (!v.time) e.time = "Pick a time";
      if (v.platforms.length === 0) e.platforms = "Select at least one platform";
      if (!v.caption.trim()) e.caption = "Write a caption";
      if (v.media.length === 0) e.media = "Upload at least one image or video";
    }
    setErrors(e);
    return Object.values(e).every((x) => !x);
  };

  const submit = (asDraft: boolean) => {
    if (!validate(asDraft)) return;
    onSave({ ...v, time: v.time || "10:00" }, asDraft);
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <button type="button" className={cx(styles.plainIcon, styles.mobileOnly)} onClick={onClose} aria-label="Back">
            <ArrowLeft />
          </button>
          <h2 id="cc-modal-title">{isEdit ? "Edit Content" : "Add New Content"}</h2>
          <button type="button" className={styles.plainIcon} onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.section}>
            <h3 className={styles.sectionHead}>
              <span className={styles.cardIcon}><FileText /></span>
              Basic Information
            </h3>

            {/* Title */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cc-title">
                Content Title<span className={styles.req}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="cc-title"
                  className={cx(styles.input, errors.title && styles.inputError)}
                  placeholder="Enter content title"
                  maxLength={TITLE_MAX}
                  value={v.title}
                  onChange={(e) => set("title", e.target.value)}
                  autoFocus
                />
                <span className={styles.counter}>
                  {v.title.length}/{TITLE_MAX}
                </span>
              </div>
              {errors.title && <span className={styles.error}>{errors.title}</span>}
            </div>

            {/* Type */}
            <div className={styles.field}>
              <span className={styles.label}>
                Content Type<span className={styles.req}>*</span>
              </span>
              <div className={styles.typeGrid}>
                {CONTENT_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t.value];
                  return (
                    <button
                      type="button"
                      key={t.value}
                      className={cx(styles.typeBtn, v.type === t.value && styles.typeBtnActive)}
                      aria-pressed={v.type === t.value}
                      onClick={() => set("type", t.value)}
                    >
                      <Icon />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platforms */}
            <div className={styles.field}>
              <span className={styles.label}>
                Platform(s)<span className={styles.req}>*</span>
              </span>
              <div className={styles.platformGrid}>
                {PLATFORMS.map((p) => {
                  const on = v.platforms.includes(p.value);
                  return (
                    <button
                      type="button"
                      key={p.value}
                      className={cx(styles.platformBtn, on && styles.platformBtnActive)}
                      aria-pressed={on}
                      onClick={() => togglePlatform(p.value)}
                    >
                      <span className={cx(styles.checkBox, on && styles.checkBoxOn)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                      <span className={styles.platformBtnIcon}>
                        <PlatformIcon platform={p.value} size={16} />
                      </span>
                      <span className={styles.platformBtnLabel}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.platforms && <span className={styles.error}>{errors.platforms}</span>}
            </div>

            {/* Date & time */}
            <div className={styles.field}>
              <span className={styles.label}>
                Post Date &amp; Time<span className={styles.req}>*</span>
              </span>
              <div className={styles.twoCol}>
                <div className={cx(styles.inputWrap, styles.inputIconWrap)}>
                  <CalendarDays className={styles.inputIcon} />
                  <input
                    type="date"
                    aria-label="Post date"
                    className={cx(styles.input, errors.date && styles.inputError)}
                    value={v.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </div>
                <div className={cx(styles.inputWrap, styles.inputIconWrap)}>
                  <Clock className={styles.inputIcon} />
                  <input
                    type="time"
                    aria-label="Post time"
                    className={cx(styles.input, errors.time && styles.inputError)}
                    value={v.time}
                    onChange={(e) => set("time", e.target.value)}
                  />
                </div>
              </div>
              {(errors.date || errors.time) && <span className={styles.error}>{errors.date || errors.time}</span>}
            </div>

            {/* Caption */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cc-caption">
                Content Caption<span className={styles.req}>*</span>
              </label>
              <div className={styles.textareaWrap}>
                <textarea
                  id="cc-caption"
                  className={cx(styles.textarea, errors.caption && styles.inputError)}
                  placeholder="Write your post caption, hashtags, mentions etc..."
                  maxLength={CAPTION_MAX}
                  value={v.caption}
                  onChange={(e) => set("caption", e.target.value)}
                />
                <span className={styles.counter}>
                  {v.caption.length}/{CAPTION_MAX}
                </span>
              </div>
              {errors.caption && <span className={styles.error}>{errors.caption}</span>}
            </div>

            {/* Media */}
            <div className={styles.field}>
              <span className={styles.label}>
                Media Upload<span className={styles.req}>*</span>
              </span>
              <div
                className={cx(styles.dropzone, dragOver && styles.dropzoneActive, errors.media && styles.inputError)}
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <UploadCloud className={styles.dropIcon} />
                <span className={styles.dropText}>
                  <strong>Upload Image/Video</strong>
                  <span>Drag &amp; drop or tap to select</span>
                  <span>(Images, Videos, PDFs - Max 50MB)</span>
                </span>
                {v.media.length > 0 && (
                  <div className={styles.previewList} onClick={(e) => e.stopPropagation()}>
                    {v.media.map((m, i) => (
                      <div key={i} className={styles.previewItem}>
                        <Thumb media={m} className={styles.previewThumb} />
                        <button
                          type="button"
                          className={styles.previewRemove}
                          aria-label="Remove file"
                          onClick={() => set("media", v.media.filter((_, j) => j !== i))}
                        >
                          <X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {errors.media && <span className={styles.error}>{errors.media}</span>}
            </div>

            {/* Tags */}
            <div className={styles.field}>
              <span className={styles.label}>Tags / Category</span>
              <div className={styles.tagSelect} ref={tagRef}>
                <button
                  type="button"
                  className={styles.tagTrigger}
                  onClick={() => setTagsOpen((o) => !o)}
                  aria-expanded={tagsOpen}
                >
                  {v.tags.length === 0 ? (
                    <span className={styles.placeholder}>Select tags (e.g. Bridal, Tutorial, Offer)</span>
                  ) : (
                    v.tags.map((t) => (
                      <span key={t} className={styles.tagChip}>
                        {t}
                        <span
                          role="button"
                          tabIndex={0}
                          className={styles.chipRemove}
                          aria-label={`Remove ${t}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(t);
                          }}
                        >
                          <X />
                        </span>
                      </span>
                    ))
                  )}
                  <ChevronDown />
                </button>
                {tagsOpen && (
                  <div className={styles.tagMenu}>
                    {TAG_OPTIONS.map((t) => {
                      const on = v.tags.includes(t);
                      return (
                        <button type="button" key={t} className={styles.popoverItem} onClick={() => toggleTag(t)}>
                          <span className={cx(styles.checkBox, on && styles.checkBoxOn)}>
                            <Check />
                          </span>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.secondaryBtn} onClick={() => submit(true)}>
            Save as Draft
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => submit(false)}>
            <Send /> {isEdit ? "Save Changes" : "Schedule Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

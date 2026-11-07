"use client";

// View, Templates, Drafts and Confirm dialogs.

import { useMemo, useState } from "react";
import { AlertTriangle, Ban, CalendarDays, Copy, Download, ExternalLink, FileText, LayoutList, Paperclip, Pin, Plus, Send, Trash2, Users } from "lucide-react";
import { AnnouncementLogo } from "../../../components/announcements/AnnouncementLogo";
import { FileDownload, FileOpen } from "../../../components/announcements/FileSource";
import {
  audienceLabel,
  categoryLabel,
  categoryOf,
  fmtDate,
  fmtDateTime,
  fmtSize,
  sanitizeHtml,
  statusOf,
  textOf,
  type Announcement,
  type Draft,
  type Person,
  type Template,
} from "../../../../data/announcementData";
import { Avatar, Modal, StatusPill } from "./ui";
import styles from "../announcement.module.css";

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function ViewModal({
  a,
  list,
  now,
  onClose,
  onDuplicate,
  onCancel,
}: {
  a: Announcement;
  list: Person[];
  now: Date;
  onClose: () => void;
  onDuplicate: () => void;
  onCancel: () => void;
}) {
  const status = statusOf(a, now);
  const html = useMemo(() => sanitizeHtml(a.message), [a.message]);
  const recipients = useMemo(() => list.filter((p) => a.recipientIds.includes(p.id)), [list, a.recipientIds]);
  const [showAll, setShowAll] = useState(false);

  return (
    <Modal
      title={a.title}
      subtitle={
        <span className={styles.viewSub}>
          <StatusPill status={status} /> by {a.createdBy} · {status === "scheduled" ? `sends ${fmtDateTime(a.sendAt)}` : `sent ${fmtDateTime(a.sendAt)}`}
        </span>
      }
      onClose={onClose}
      wide
      footer={
        <>
          {(status === "active" || status === "scheduled") && (
            <button className={styles.dangerBtn} onClick={onCancel}>
              <Ban size={16} /> {status === "scheduled" ? "Cancel schedule" : "Cancel announcement"}
            </button>
          )}
          <span className={styles.flexSpacer} />
          {status !== "cancelled" && (
            <a className={styles.ghostBtn} href={`/dashboard/Announcements/${encodeURIComponent(a.id)}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} /> Open notice page
            </a>
          )}
          <button className={styles.ghostBtn} onClick={onDuplicate}>
            <Copy size={16} /> Duplicate
          </button>
          <button className={styles.primaryBtn} onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className={styles.viewHead}>
        <AnnouncementLogo logo={a.logo} category={categoryOf(a)} urgent={a.urgent} size={52} />
        <div className={styles.viewTags}>
          <span>
            <LayoutList size={13} /> {categoryLabel(categoryOf(a))}
          </span>
          {a.pinned && (
            <span>
              <Pin size={13} /> Pinned
            </span>
          )}
          {a.urgent && (
            <span className={styles.tagUrgent}>
              <AlertTriangle size={13} /> Urgent
            </span>
          )}
        </div>
      </div>
      <div className={styles.viewMeta}>
        <span>
          <CalendarDays size={15} /> Visible {fmtDate(a.startDate)} – {fmtDate(a.endDate)}
        </span>
        <span>
          <Users size={15} /> {audienceLabel(a.audience, list)} · {a.recipientIds.length} {a.recipientIds.length === 1 ? "recipient" : "recipients"}
        </span>
      </div>
      <div className={styles.viewMessage} dangerouslySetInnerHTML={{ __html: html }} />
      {a.attachments.length > 0 && (
        <div>
          <h4 className={styles.subHead}>
            <Paperclip size={15} /> Attachments
          </h4>
          <ul className={styles.fileList}>
            {a.attachments.map((f) => (
              <li key={f.id}>
                <FileText size={17} />
                <span title={f.name}>{f.name}</span>
                <small>{fmtSize(f.size)}</small>
                {f.url ? (
                  <>
                    <FileOpen file={f} className={styles.fileOpen} aria-label={`Open ${f.name}`} title="Open">
                      <ExternalLink size={14} />
                    </FileOpen>
                    <FileDownload file={f} className={styles.fileOpen} aria-label={`Download ${f.name}`} title="Download">
                      <Download size={14} />
                    </FileDownload>
                  </>
                ) : (
                  <small className={styles.fileMissing} title="No real file (sample data, or attached before uploads were enabled)">
                    not uploaded
                  </small>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h4 className={styles.subHead}>
          <Users size={15} /> Recipients ({recipients.length})
        </h4>
        <div className={styles.recipients}>
          {(showAll ? recipients : recipients.slice(0, 12)).map((p) => (
            <span key={p.id} className={styles.recipient}>
              <Avatar name={p.name} photoUrl={p.photoUrl} size={22} /> {p.name}
            </span>
          ))}
          {recipients.length > 12 && !showAll && (
            <button className={styles.linkBtn} onClick={() => setShowAll(true)}>
              +{recipients.length - 12} more
            </button>
          )}
          {!recipients.length && <p className={styles.muted}>No recipients.</p>}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export function TemplatesModal({
  templates,
  canSaveCurrent,
  onUse,
  onSaveCurrent,
  onDelete,
  onClose,
}: {
  templates: Template[];
  canSaveCurrent: boolean;
  onUse: (t: Template) => void;
  onSaveCurrent: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <Modal title="Manage Templates" subtitle="Start an announcement from a template, or save the current one for reuse." onClose={onClose} wide>
      <div className={styles.saveTpl}>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={canSaveCurrent ? "Template name, e.g. Monthly newsletter" : "Write a title and message first to save a template"}
          disabled={!canSaveCurrent}
        />
        <button
          className={styles.primaryBtn}
          disabled={!canSaveCurrent || !name.trim()}
          onClick={() => {
            onSaveCurrent(name.trim());
            setName("");
          }}
        >
          <Plus size={16} /> Save current as template
        </button>
      </div>
      <ul className={styles.tplList}>
        {templates.map((t) => (
          <li key={t.id}>
            <span className={styles.tplIcon}>
              <FileText size={18} />
            </span>
            <div>
              <b>{t.name}</b>
              <small>{t.title}</small>
              <p>{textOf(t.message).slice(0, 110)}…</p>
            </div>
            <div className={styles.tplActions}>
              <button className={styles.ghostBtn} onClick={() => onUse(t)}>
                Use
              </button>
              <button className={styles.iconBtn} onClick={() => onDelete(t.id)} aria-label={`Delete template ${t.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {!templates.length && <p className={styles.muted}>No templates yet.</p>}
      </ul>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Drafts                                                              */
/* ------------------------------------------------------------------ */

export function DraftsModal({
  drafts,
  onLoad,
  onDelete,
  onClose,
}: {
  drafts: Draft[];
  onLoad: (d: Draft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Drafts" subtitle="Continue an announcement you saved earlier." onClose={onClose} wide>
      <ul className={styles.tplList}>
        {drafts.map((d) => (
          <li key={d.id}>
            <span className={styles.tplIcon}>
              <FileText size={18} />
            </span>
            <div>
              <b>{d.input.title || "Untitled announcement"}</b>
              <small>Saved {fmtDateTime(d.savedAt)}</small>
              <p>{textOf(d.input.message).slice(0, 110) || "No message yet."}</p>
            </div>
            <div className={styles.tplActions}>
              <button className={styles.ghostBtn} onClick={() => onLoad(d)}>
                <Send size={15} /> Continue
              </button>
              <button className={styles.iconBtn} onClick={() => onDelete(d.id)} aria-label="Delete draft">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {!drafts.length && <p className={styles.muted}>No drafts. Use “Save as Draft” on the form to keep one here.</p>}
      </ul>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm                                                             */
/* ------------------------------------------------------------------ */

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className={styles.ghostBtn} onClick={onClose}>
            Keep it
          </button>
          <button className={styles.dangerSolid} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className={styles.confirmText}>{message}</p>
    </Modal>
  );
}

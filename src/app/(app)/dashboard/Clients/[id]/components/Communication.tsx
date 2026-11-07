"use client";
// Path: src/app/dashboard/Clients/[id]/components/Communication.tsx
// Recent Conversations, Internal Note / Last Update, Activity Timeline

import { useState } from "react";
import { FiActivity, FiFileText, FiMessageSquare, FiPlus, FiSend } from "react-icons/fi";
import { useClient } from "./ClientStore";
import { Avatar, Card, LinkBtn, StatusPill } from "./ui";
import s from "../ClientDetails.module.css";

export function ConversationsCard({ limit = 1, full }: { limit?: number; full?: boolean }) {
  const { data, setTab, sendMessage } = useClient();
  const [text, setText] = useState("");
  const list = full ? data.conversations : data.conversations.slice(0, limit);

  return (
    <Card title="Recent Conversations" icon={<FiMessageSquare />} action={!full && <LinkBtn onClick={() => setTab("conversations")}>View All</LinkBtn>}>
      <ul className={s.convList}>
        {list.map((m) => (
          <li key={m.id} className={s.convItem}>
            <Avatar src={m.avatar} name={m.name} size={36} />
            <div className={s.convBody}>
              <div className={s.convHead}>
                <strong>{m.name}</strong>
                <span>{m.time}</span>
                <StatusPill status={m.tag} />
              </div>
              <p>{m.message}</p>
            </div>
          </li>
        ))}
      </ul>
      {full && (
        <form
          className={s.composer}
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendMessage(text.trim());
            setText("");
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" />
          <button type="submit" className={s.btnPrimarySm} disabled={!text.trim()}>
            <FiSend /> Send
          </button>
        </form>
      )}
    </Card>
  );
}

export function InternalNoteCard({ full }: { full?: boolean }) {
  const { data, openModal } = useClient();
  const list = full ? data.notes : data.notes.slice(0, 1);
  return (
    <Card
      title="Internal Note / Last Update"
      icon={<FiFileText />}
      action={<button type="button" className={s.btnOutlineSm} onClick={() => openModal("addNote")}><FiPlus /> Add Note</button>}
    >
      <ul className={s.convList}>
        {list.map((n) => (
          <li key={n.id} className={s.convItem}>
            <Avatar src={n.avatar} name={n.author} size={36} />
            <div className={s.convBody}>
              <div className={s.convHead}>
                <strong>{n.author}</strong>
                <span>{n.time}</span>
                <StatusPill status={n.tag} />
              </div>
              <p>{n.text}</p>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className={s.empty}>No notes yet</li>}
      </ul>
    </Card>
  );
}

export function ActivityTimelineCard({ limit = 4, full }: { limit?: number; full?: boolean }) {
  const { data, setTab } = useClient();
  const list = full ? data.activity : data.activity.slice(0, limit);
  return (
    <Card title="Activity Timeline" icon={<FiActivity />} action={!full && <LinkBtn onClick={() => setTab("notes")}>View All</LinkBtn>}>
      <ol className={s.timeline}>
        {list.map((a) => (
          <li key={a.id}>
            <i style={{ background: a.color, boxShadow: `0 0 0 3px ${a.color}33` }} />
            <span className={s.tlTime}>{a.time}</span>
            <span className={s.tlText}>{a.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

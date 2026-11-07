"use client";
// Path: src/app/dashboard/Clients/[id]/components/Modals.tsx

import { useState, type FormEvent } from "react";
import { FiCheck, FiPlus } from "react-icons/fi";
import { ASSIGNABLE_TEAM, todayISO, type PostBucket, type PostStatus, type PostType } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import CampaignModal from "./CampaignModal";
import { Avatar, Field, Modal } from "./ui";
import s from "../ClientDetails.module.css";


function Footer({ onCancel, submitLabel, form }: { onCancel: () => void; submitLabel: string; form: string }) {
  return (
    <>
      <button type="button" className={s.btnOutline} onClick={onCancel}>Cancel</button>
      <button type="submit" form={form} className={s.btnPrimary}>{submitLabel}</button>
    </>
  );
}

function EditClientModal() {
  const { data, updateClient, openModal, showToast } = useClient();
  const close = () => openModal(null);
  const [f, setF] = useState({
    name: data.name,
    status: data.status,
    categories: data.categories.join(" | "),
    location: data.location,
    phone: data.phone,
    email: data.email,
    website: data.website,
    businessType: data.info.businessType,
    contactPerson: data.info.contactPerson,
    package: data.info.package,
    startDate: data.info.startDate,
    endDate: data.info.endDate,
  });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Client name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return setErr("Enter a valid email");
    if (f.endDate <= f.startDate) return setErr("End date must be after start date");
    updateClient({
      name: f.name.trim(),
      status: f.status,
      categories: f.categories.split("|").map((c) => c.trim()).filter(Boolean),
      location: f.location,
      phone: f.phone,
      email: f.email,
      website: f.website,
      info: { businessType: f.businessType, contactPerson: f.contactPerson, package: f.package, startDate: f.startDate, endDate: f.endDate },
    });
    showToast("Client details saved");
    close();
  };

  return (
    <Modal title="Edit Client" onClose={close} wide footer={<Footer onCancel={close} submitLabel="Save Changes" form="editClient" />}>
      <form id="editClient" className={s.formGrid} onSubmit={submit}>
        <Field label="Client Name"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")}>
            <option>Active</option><option>Inactive</option><option>Prospect</option>
          </select>
        </Field>
        <Field label="Categories (separate with |)"><input value={f.categories} onChange={set("categories")} /></Field>
        <Field label="Business Type"><input value={f.businessType} onChange={set("businessType")} /></Field>
        <Field label="Location"><input value={f.location} onChange={set("location")} /></Field>
        <Field label="Contact Person"><input value={f.contactPerson} onChange={set("contactPerson")} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set("phone")} inputMode="tel" /></Field>
        <Field label="Email"><input value={f.email} onChange={set("email")} type="email" /></Field>
        <Field label="Website"><input value={f.website} onChange={set("website")} /></Field>
        <Field label="Package"><input value={f.package} onChange={set("package")} /></Field>
        <Field label="Start Date"><input type="date" value={f.startDate} onChange={set("startDate")} /></Field>
        <Field label="End Date"><input type="date" value={f.endDate} onChange={set("endDate")} /></Field>
        {err && <p className={s.formError}>{err}</p>}
      </form>
    </Modal>
  );
}

function AddPostModal() {
  const { addPost, openModal, showToast } = useClient();
  const close = () => openModal(null);
  const [f, setF] = useState({ title: "", type: "Static" as PostType, date: todayISO(), time: "10:00", status: "Scheduled" as PostStatus });
  const [image, setImage] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr("Post title is required");
    const t = todayISO();
    const bucket: PostBucket = f.date < t ? "past" : f.date === t ? "today" : "upcoming";
    const [h, m] = f.time.split(":").map(Number);
    const time = `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    addPost(bucket, { title: f.title.trim(), type: f.type, date: f.date, time, status: f.status, image });
    showToast("Post added to calendar");
    close();
  };

  return (
    <Modal title="Add Post" onClose={close} footer={<Footer onCancel={close} submitLabel="Add Post" form="addPost" />}>
      <form id="addPost" className={s.formGrid} onSubmit={submit}>
        <Field label="Post Title"><input value={f.title} onChange={set("title")} placeholder="e.g. Bridal Makeup Look" autoFocus /></Field>
        <Field label="Type">
          <select value={f.type} onChange={set("type")}>
            <option>Static</option><option>Reel</option><option>Story</option><option>Carousel</option>
          </select>
        </Field>
        <Field label="Date"><input type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="Time"><input type="time" value={f.time} onChange={set("time")} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")}>
            <option>Scheduled</option><option>Published</option><option>Draft</option>
          </select>
        </Field>
        <Field label="Creative (optional)">
          <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; setImage(file ? URL.createObjectURL(file) : null); }} />
        </Field>
        {err && <p className={s.formError}>{err}</p>}
      </form>
    </Modal>
  );
}

function AddNoteModal() {
  const { addNote, openModal, showToast } = useClient();
  const close = () => openModal(null);
  const [text, setText] = useState("");
  return (
    <Modal title="Add Internal Note" onClose={close} footer={<Footer onCancel={close} submitLabel="Save Note" form="addNote" />}>
      <form
        id="addNote"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addNote(text.trim());
          showToast("Note added");
          close();
        }}
      >
        <Field label="Note">
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write an internal update for the team…" autoFocus />
        </Field>
      </form>
    </Modal>
  );
}

function ManageTeamModal() {
  const { data, setTeam, openModal, showToast } = useClient();
  const close = () => openModal(null);
  const [ids, setIds] = useState<string[]>(data.team.map((t) => t.id));
  const toggle = (id: string) => setIds((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  const pool = [...ASSIGNABLE_TEAM, ...data.team.filter((t) => !ASSIGNABLE_TEAM.some((a) => a.id === t.id))];

  return (
    <Modal
      title="Manage Assigned Team"
      onClose={close}
      footer={
        <>
          <button type="button" className={s.btnOutline} onClick={close}>Cancel</button>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={() => { setTeam(pool.filter((p) => ids.includes(p.id))); showToast("Team updated"); close(); }}
          >
            Save Team
          </button>
        </>
      }
    >
      <ul className={s.teamPick}>
        {pool.map((m) => {
          const on = ids.includes(m.id);
          return (
            <li key={m.id}>
              <Avatar src={m.avatar} name={m.name} size={34} />
              <div>
                <strong>{m.name}</strong>
                <small>{m.role}</small>
              </div>
              <button type="button" className={`${s.btnChip} ${on ? s.chipOn : ""}`} onClick={() => toggle(m.id)} aria-pressed={on}>
                {on ? <><FiCheck /> Assigned</> : <><FiPlus /> Assign</>}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

export default function Modals() {
  const { modal, modalPayload } = useClient();
  if (modal === "editClient") return <EditClientModal />;
  if (modal === "addCampaign" || modal === "editCampaign") return <CampaignModal key={modalPayload ?? "new"} />;
  if (modal === "addPost") return <AddPostModal />;
  if (modal === "addNote") return <AddNoteModal />;
  if (modal === "manageTeam") return <ManageTeamModal />;
  return null;
}


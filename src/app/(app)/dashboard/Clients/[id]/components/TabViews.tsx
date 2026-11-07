"use client";
// cspell:words Minfo Mcamp Conv Mconv
// Path: src/app/dashboard/Clients/[id]/components/TabViews.tsx
// What each tab shows. Overview uses a CSS grid with named areas (see ClientDetails.module.css).

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FiCheckSquare, FiDownload, FiFolder, FiPlus, FiSettings, FiTrash2, FiUpload } from "react-icons/fi";
import { formatDate, todayISO } from "../../../../../data/clientDetailsData";
import { CampaignTableCard, MobileCampaigns } from "./Campaigns";
import CampaignsTab from "./CampaignsTab";
import { ActivityTimelineCard, ConversationsCard, InternalNoteCard } from "./Communication";
import { ContentCalendarCard, TotalCreativesCard, WorksCard } from "./ContentAndCreatives";
import ContentCalendar from "./ContentCalendar/ContentCalendar";
import ContentCreatives from "./ContentCreatives/ContentCreatives";
import { AccountAccessCard, ClientInfoCard, MobileClientInfo, QuickActions } from "./LeftPanel";
import { Last7DaysCard, MonthlyReportCard, ReportsDashboard, ReportsOverviewCard } from "./Reports";
import { useClient, type TabKey } from "./ClientStore";
import { Card, StatusPill } from "./ui";
import StatCards from "./StatCards";
import s from "../ClientDetails.module.css";

export function OverviewTab() {
  return (
    <>
      <StatCards />
      <div className={s.overview}>
        <div className={s.aLeft}>
          <ClientInfoCard />
          <AccountAccessCard />
        </div>
        <div className={s.aMinfo}><MobileClientInfo /></div>
        <div className={s.aPast}><CampaignTableCard bucket="past" /></div>
        <div className={s.aCur}><CampaignTableCard bucket="current" /></div>
        <div className={s.aUp}><CampaignTableCard bucket="upcoming" /></div>
        <div className={s.aMcamp}><MobileCampaigns /></div>
        <div className={s.aCal}><ContentCalendarCard /></div>
        <div className={s.aTc}><TotalCreativesCard /></div>
        <div className={s.aWorks}><WorksCard /></div>
        <div className={s.aQuick}><QuickActions /></div>
        <div className={s.aRep}><ReportsOverviewCard /></div>
        <div className={s.aL7}><Last7DaysCard /></div>
        <div className={s.aMon}><MonthlyReportCard /></div>
        <div className={s.aConv}><ConversationsCard limit={1} /></div>
        <div className={s.aMconv}><ConversationsCard limit={3} /></div>
        <div className={s.aNotes}><InternalNoteCard /></div>
        <div className={s.aTl}><ActivityTimelineCard /></div>
      </div>
    </>
  );
}

function ReportsTab() {
  return <ReportsDashboard />;
}

function ConversationsTab() {
  return (
    <div className={s.twoColWide}>
      <ConversationsCard full />
      <InternalNoteCard full />
    </div>
  );
}

function FilesTab() {
  const { data, uploadFiles, removeFile, showToast } = useClient();
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const files = data.files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card
      title={`Files (${data.files.length})`}
      icon={<FiFolder />}
      action={<button type="button" className={s.btnPrimarySm} onClick={() => ref.current?.click()}><FiUpload /> Upload</button>}
    >
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const f = Array.from(e.target.files ?? []);
          if (f.length) { uploadFiles(f); showToast(`${f.length} file(s) uploaded`); }
          e.target.value = "";
        }}
      />
      <input className={s.search} placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search files" />
      <div className={s.tableScroll}>
        <table className={`${s.miniTable} ${s.fullTable}`}>
          <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th /></tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td className={s.strong}>{f.name}</td>
                <td><span className={s.fileType}>{f.type}</span></td>
                <td>{f.size}</td>
                <td>{f.uploadedBy}</td>
                <td>{formatDate(f.date)}</td>
                <td className={s.rowActions}>
                  {f.url ? (
                    <a href={f.url} download={f.name} className={s.iconBtn} aria-label={`Download ${f.name}`}><FiDownload /></a>
                  ) : (
                    <button type="button" className={s.iconBtn} aria-label={`Download ${f.name}`} onClick={() => showToast("Demo file — connect storage to download")}><FiDownload /></button>
                  )}
                  <button type="button" className={s.iconBtn} aria-label={`Delete ${f.name}`} onClick={() => { removeFile(f.id); showToast("File removed"); }}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {files.length === 0 && <tr><td colSpan={6} className={s.empty}>No files found</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function NotesTasksTab() {
  const { data, addTask, toggleTask, removeTask } = useClient();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(data.team[0]?.name ?? "");
  const [due, setDue] = useState(todayISO);
  const open = data.tasks.filter((t) => !t.done).length;

  return (
    <div className={s.twoColWide}>
      <Card title={`Tasks (${open} open)`} icon={<FiCheckSquare />}>
        <form
          className={s.taskForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            addTask({ title: title.trim(), assignee, due });
            setTitle("");
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" aria-label="Task title" />
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
            {data.team.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
          <button type="submit" className={s.btnPrimarySm}><FiPlus /> Add</button>
        </form>
        <ul className={s.taskList}>
          {data.tasks.map((t) => (
            <li key={t.id} className={t.done ? s.taskDone : ""}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                <span>{t.title}</span>
              </label>
              <small>{t.assignee} · due {formatDate(t.due)}</small>
              <button type="button" className={s.iconBtn} onClick={() => removeTask(t.id)} aria-label={`Delete ${t.title}`}><FiTrash2 /></button>
            </li>
          ))}
        </ul>
      </Card>
      <div className={s.stack}>
        <InternalNoteCard full />
        <ActivityTimelineCard full />
      </div>
    </div>
  );
}

function SettingsTab() {
  const { data, openModal, updateClient, showToast } = useClient();
  return (
    <div className={s.twoColWide}>
      <Card title="Client Settings" icon={<FiSettings />}>
        <div className={s.settingRow}>
          <div>
            <strong>Client status</strong>
            <small>Inactive clients are hidden from active dashboards.</small>
          </div>
          <select
            className={s.select}
            value={data.status}
            onChange={(e) => { updateClient({ status: e.target.value }); showToast(`Status set to ${e.target.value}`); }}
          >
            <option>Active</option><option>Inactive</option><option>Prospect</option>
          </select>
        </div>
        <div className={s.settingRow}>
          <div>
            <strong>Profile details</strong>
            <small>Name, contact, package and contract dates.</small>
          </div>
          <button type="button" className={s.btnOutline} onClick={() => openModal("editClient")}>Edit Client</button>
        </div>
        <div className={s.settingRow}>
          <div>
            <strong>Assigned team</strong>
            <small>{data.team.map((t) => t.name).join(", ")}</small>
          </div>
          <button type="button" className={s.btnOutline} onClick={() => openModal("manageTeam")}>Manage</button>
        </div>
        <div className={s.settingRow}>
          <div>
            <strong>Current status</strong>
            <small>Visible on the client header.</small>
          </div>
          <StatusPill status={data.status} />
        </div>
      </Card>
      <AccountAccessCard />
    </div>
  );
}

export default function TabViews() {
  const { tab } = useClient();
  const { id } = useParams<{ id: string }>();
  // .tabBody makes every section use the full width on phones (see ClientDetails.module.css)
  return <div className={s.tabBody}>{renderTab(tab, id)}</div>;
}

function renderTab(tab: TabKey, id: string) {
  switch (tab) {
    case "campaigns": return <CampaignsTab />;
    case "calendar": return <ContentCalendar clientId={id} />;
    case "creatives": return <ContentCreatives clientId={id} />;
    case "reports": return <ReportsTab />;
    case "conversations": return <ConversationsTab />;
    case "files": return <FilesTab />;
    case "notes": return <NotesTasksTab />;
    case "settings": return <SettingsTab />;
    default: return <OverviewTab />;
  }
}

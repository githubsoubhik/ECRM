"use client";
// Path: src/app/dashboard/Clients/[id]/components/LeftPanel.tsx
// Client Information, Account Access, Quick Actions (+ compact mobile version of Client Info)

import { useRef } from "react";
import { FaFacebookF, FaInstagram, FaStore } from "react-icons/fa";
import {
  FiBriefcase, FiCalendar, FiEdit3, FiMail, FiMapPin, FiPackage, FiPhone, FiPlus, FiUpload, FiUser, FiUsers, FiZap,
} from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { formatDate, type Platform } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import { Card } from "./ui";
import s from "../ClientDetails.module.css";

export const PLATFORM: Record<Platform, { icon: React.ReactNode; cls: string; name: string }> = {
  facebook: { icon: <FaFacebookF />, cls: s.socFb, name: "Facebook" },
  instagram: { icon: <FaInstagram />, cls: s.socIg, name: "Instagram" },
  gmb: { icon: <FaStore />, cls: s.socGmb, name: "Google My Business" },
};

export function ClientInfoCard() {
  const { data, openModal } = useClient();
  const rows = [
    { icon: <FiUser />, k: "Client Name", v: data.name },
    { icon: <FiBriefcase />, k: "Business Type", v: data.info.businessType },
    { icon: <FiMapPin />, k: "Location", v: data.location },
    { icon: <FiUsers />, k: "Contact Person", v: `${data.info.contactPerson} (${data.info.contactRole})` },
    { icon: <FiPhone />, k: "Contact Number", v: <a href={`tel:${data.phone.replace(/\s/g, "")}`}>{data.phone}</a> },
    { icon: <FiMail />, k: "Email", v: <a href={`mailto:${data.email}`} className={s.link}>{data.email}</a> },
    { icon: <FiPackage />, k: "Package", v: data.info.package },
    { icon: <FiCalendar />, k: "Start Date", v: formatDate(data.info.startDate) },
    { icon: <FiCalendar />, k: "End Date", v: formatDate(data.info.endDate) },
  ];
  return (
    <Card
      title="Client Information"
      action={<button type="button" className={s.btnChip} onClick={() => openModal("editClient")}>Edit</button>}
    >
      <dl className={s.infoList}>
        {rows.map((r) => (
          <div key={r.k} className={s.infoRow}>
            <dt>
              <span className={s.infoIcon}>{r.icon}</span>
              {r.k}
            </dt>
            <dd>{r.v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function AccountAccessCard() {
  const { data, toggleAccount, showToast } = useClient();
  return (
    <Card title="Account Access" action={<button type="button" className={s.btnChip} onClick={() => showToast("Click a status badge to connect / disconnect")}>Edit</button>}>
      <ul className={s.accountList}>
        {data.accounts.map((a) => {
          const p = PLATFORM[a.platform];
          return (
            <li key={a.platform}>
              <a href={a.url} target="_blank" rel="noreferrer" className={s.accountName}>
                <span className={`${s.socBtn} ${s.socSm} ${p.cls}`}>{p.icon}</span>
                {a.handle}
              </a>
              <button
                type="button"
                className={`${s.connBadge} ${a.connected ? s.connOn : s.connOff}`}
                onClick={() => {
                  toggleAccount(a.platform);
                  showToast(`${p.name} ${a.connected ? "disconnected" : "connected"}`);
                }}
                title={a.connected ? "Click to disconnect" : "Click to connect"}
              >
                {a.connected ? "Connected" : "Connect"}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Compact Client Info used on phones (matches the mobile mockup) */
export function MobileClientInfo() {
  const { data, openModal, toggleAccount } = useClient();
  return (
    <Card
      title="Client Information"
      icon={<FiUser />}
      action={<button type="button" className={s.btnChip} onClick={() => openModal("editClient")}>Edit</button>}
    >
      <div className={s.mInfo}>
        <ul className={s.mInfoList}>
          <li>
            <FiUser />
            <div>
              <strong>{data.name}</strong>
              <small>{data.info.businessType}</small>
            </div>
          </li>
          <li><FiPhone /> <a href={`tel:${data.phone.replace(/\s/g, "")}`}>{data.phone}</a></li>
          <li><FiMapPin /> {data.location}</li>
        </ul>
        <div className={s.mInfoSide}>
          <div className={s.mAccounts}>
            {data.accounts.map((a) => (
              <button key={a.platform} type="button" onClick={() => toggleAccount(a.platform)} className={s.mAccount}>
                <span className={`${s.socBtn} ${s.socSm} ${PLATFORM[a.platform].cls}`}>{PLATFORM[a.platform].icon}</span>
                <small className={a.connected ? s.textGreen : s.textMuted}>{a.connected ? "Connected" : "Off"}</small>
              </button>
            ))}
          </div>
          <p className={s.mMeta}><FiPackage /> {data.info.package}</p>
          <p className={s.mMeta}><FiCalendar /> {formatDate(data.info.startDate)} – {formatDate(data.info.endDate)}</p>
        </div>
      </div>
    </Card>
  );
}

export function QuickActions() {
  const { openModal, uploadCreatives, showToast } = useClient();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Card title="Quick Actions" icon={<FiZap />} className={s.quickCard}>
      <div className={s.quickGrid}>
        <button type="button" className={`${s.qa} ${s.qaGreen}`} onClick={() => openModal("addCampaign")}>
          <FiPlus /> Add Campaign
        </button>
        <button type="button" className={`${s.qa} ${s.qaPurple}`} onClick={() => openModal("addPost")}>
          <HiOutlineSpeakerphone /> Add Post
        </button>
        <button type="button" className={`${s.qa} ${s.qaBlue}`} onClick={() => fileRef.current?.click()}>
          <FiUpload /> Upload Creative
        </button>
        <button type="button" className={`${s.qa} ${s.qaOrange}`} onClick={() => openModal("addNote")}>
          <FiEdit3 /> Add Note
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) {
            uploadCreatives(files);
            showToast(`${files.length} creative${files.length > 1 ? "s" : ""} uploaded`);
          }
          e.target.value = "";
        }}
      />
    </Card>
  );
}

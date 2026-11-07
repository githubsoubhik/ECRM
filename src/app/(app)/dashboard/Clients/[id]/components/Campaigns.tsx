"use client";
// Path: src/app/dashboard/Clients/[id]/components/Campaigns.tsx

import { useState } from "react";
import { FiCalendar, FiClock, FiFlag, FiRadio } from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { campaignResult, campaignStatus, formatINR, formatPeriod, type CampaignBucket } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import { Avatar, Card, LinkBtn, Segmented, StatusPill, Thumb } from "./ui";
import s from "../ClientDetails.module.css";

const META: Record<CampaignBucket, { title: string; icon: React.ReactNode; tone: "green" | "blue" | "orange" }> = {
  past: { title: "Past Campaigns", icon: <FiCalendar />, tone: "green" },
  current: { title: "Current Campaigns", icon: <FiRadio />, tone: "blue" },
  upcoming: { title: "Upcoming Campaigns", icon: <FiClock />, tone: "orange" },
};

export function CampaignTableCard({ bucket, limit = 4 }: { bucket: CampaignBucket; limit?: number }) {
  const { data, setTab } = useClient();
  const rows = data.campaigns[bucket].slice(0, limit);
  const m = META[bucket];
  const isUpcoming = bucket === "upcoming";

  return (
    <Card title={m.title} icon={m.icon} tone={m.tone} action={<LinkBtn onClick={() => setTab("campaigns")}>View All</LinkBtn>}>
      <div className={s.tableScroll}>
        <table className={s.miniTable}>
          <thead>
            <tr>
              <th>Period</th>
              <th>Campaign Type</th>
              <th>Budget</th>
              <th>{isUpcoming ? "Goal" : "Result"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} title={c.name}>
                <td>
                  {bucket === "current" && <i className={s.liveDot} aria-label="Running" />}
                  {formatPeriod(c.startDate, c.endDate)}
                </td>
                <td>{c.type}</td>
                <td>{formatINR(c.budget)}</td>
                <td>{isUpcoming ? c.goal : campaignResult(c)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className={s.empty}>No campaigns yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Full-width campaign list used on the Campaigns tab */
export function CampaignFullTable({ bucket }: { bucket: CampaignBucket }) {
  const { data } = useClient();
  const m = META[bucket];
  const isUpcoming = bucket === "upcoming";
  return (
    <Card title={`${m.title} (${data.campaigns[bucket].length})`} icon={m.icon} tone={m.tone}>
      <div className={s.tableScroll}>
        <table className={`${s.miniTable} ${s.fullTable}`}>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Period</th>
              <th>Type</th>
              <th>Budget</th>
              <th>{isUpcoming ? "Goal" : "Result"}</th>
              <th>Run By</th>
            </tr>
          </thead>
          <tbody>
            {data.campaigns[bucket].map((c) => (
              <tr key={c.id}>
                <td className={s.strong}>
                  {bucket === "current" && <i className={s.liveDot} />}
                  {c.name}
                </td>
                <td>{formatPeriod(c.startDate, c.endDate)}</td>
                <td>{c.type}</td>
                <td>{formatINR(c.budget)}</td>
                <td>{isUpcoming ? c.goal : campaignResult(c)}</td>
                <td>{c.runBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Phone version: one card with Past / Current / Upcoming tabs and a swipeable carousel */
export function MobileCampaigns() {
  const { data, setTab, asOfDate } = useClient();
  const [bucket, setBucket] = useState<CampaignBucket>("current");
  const [index, setIndex] = useState(0);
  const list = data.campaigns[bucket];
  const c = list[Math.min(index, list.length - 1)];
  const [touchX, setTouchX] = useState<number | null>(null);

  const go = (d: number) => setIndex((i) => (list.length ? (i + d + list.length) % list.length : 0));

  return (
    <Card title="Campaigns" icon={<HiOutlineSpeakerphone />} action={<LinkBtn onClick={() => setTab("campaigns")}>View All</LinkBtn>}>
      <Segmented
        className={s.segFull}
        value={bucket}
        onChange={(b) => { setBucket(b); setIndex(0); }}
        options={[
          { value: "past", label: "Past Campaigns" },
          { value: "current", label: "Current Campaigns" },
          { value: "upcoming", label: "Upcoming Campaigns" },
        ]}
      />
      {c ? (
        <div
          className={s.mCampaign}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          <div className={s.mCampaignImg}>
            <Thumb src={c.thumbnail ?? null} label={c.type} />
            <span className={s.typeTag}>{c.platforms?.includes("instagram") ? "IG" : c.platforms?.includes("facebook") ? "FB" : "Ad"}</span>
          </div>
          <div className={s.mCampaignMain}>
            <StatusPill status={campaignStatus(c, asOfDate)} />
            <strong>{c.name}</strong>
            <small>{c.type}</small>
            <small><FiCalendar /> {formatPeriod(c.startDate, c.endDate)}</small>
          </div>
          <div className={s.mCampaignStats}>
            <div><small>Budget</small><strong>{formatINR(c.budget)}</strong></div>
            <div><small>{bucket === "upcoming" ? "Goal" : "Result"}</small><strong>{bucket === "upcoming" ? c.goal : campaignResult(c)}</strong></div>
            <div><small>{bucket === "upcoming" ? "Type" : "Goal"}</small><strong>{bucket === "upcoming" ? c.type : c.goal ?? c.type}</strong></div>
            <div>
              <small>Run By</small>
              <span className={s.runBy}><Avatar src={null} name={c.runBy ?? "Team"} size={18} /> {c.runBy ?? "Team"}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className={s.empty}><FiFlag /> No campaigns here yet</p>
      )}
      {list.length > 1 && (
        <div className={s.dots}>
          {list.map((x, i) => (
            <button key={x.id} type="button" aria-label={`Campaign ${i + 1}`} className={i === index ? s.dotActive : ""} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </Card>
  );
}

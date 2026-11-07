"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentAndCreatives.tsx
// Content Calendar, Total Creatives (donut), Works

import { useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiImage, FiLayers, FiPlus, FiUpload } from "react-icons/fi";
import { formatDate, formatShortDate, type CalendarPost, type PostBucket } from "../../../../../data/clientDetailsData";
import { Donut, SERIES } from "./Charts";
import { useClient } from "./ClientStore";
import { Card, LinkBtn, Segmented, StatusPill, Thumb } from "./ui";
import s from "../ClientDetails.module.css";

function PostCard({ p }: { p: CalendarPost }) {
  return (
    <article className={s.postCard}>
      <div className={s.postImg}>
        <Thumb src={p.image} label={p.title} />
        <span className={`${s.typeTag} ${p.type === "Reel" ? s.typeReel : ""}`}>{p.type}</span>
      </div>
      <span className={s.postTime}>{p.time}</span>
      <strong className={s.postTitle} title={p.title}>{p.title}</strong>
      <StatusPill status={p.status} />
    </article>
  );
}

export function ContentCalendarCard() {
  const { data, setTab, openModal, isToday, asOfDate } = useClient();
  const dayLabel = isToday ? "Today" : formatShortDate(asOfDate);
  const [bucket, setBucket] = useState<PostBucket>("today");
  const railRef = useRef<HTMLDivElement>(null);
  const posts = data.calendar[bucket];
  const scroll = (d: number) => railRef.current?.scrollBy({ left: d * (railRef.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <Card title="Content Calendar" icon={<FiCalendar />} action={<LinkBtn onClick={() => setTab("calendar")}>View Calendar</LinkBtn>}>
      <Segmented
        className={s.segFull}
        value={bucket}
        onChange={setBucket}
        options={[
          { value: "past", label: `Past Posts (${data.calendar.past.length})` },
          { value: "today", label: `${dayLabel} (${data.calendar.today.length})` },
          { value: "upcoming", label: `Upcoming (${data.calendar.upcoming.length})` },
        ]}
      />
      <div className={s.railWrap}>
        <button type="button" className={`${s.railBtn} ${s.railPrev}`} onClick={() => scroll(-1)} aria-label="Previous posts">
          <FiChevronLeft />
        </button>
        <div className={s.rail} ref={railRef}>
          {posts.map((p) => <PostCard key={p.id} p={p} />)}
          {posts.length === 0 && (
            <button type="button" className={s.emptyPost} onClick={() => openModal("addPost")}>
              <FiPlus /> Add a post
            </button>
          )}
        </div>
        <button type="button" className={`${s.railBtn} ${s.railNext}`} onClick={() => scroll(1)} aria-label="Next posts">
          <FiChevronRight />
        </button>
      </div>
    </Card>
  );
}

/** Full calendar view for the Content Calendar tab — posts grouped by date */
export function CalendarBoard() {
  const { data, openModal, isToday, asOfDate } = useClient();
  const [bucket, setBucket] = useState<PostBucket | "all">("all");
  const [type, setType] = useState<string>("all");
  const all = (bucket === "all" ? [...data.calendar.past, ...data.calendar.today, ...data.calendar.upcoming] : data.calendar[bucket]).filter(
    (p) => type === "all" || p.type === type
  );
  const groups = all.reduce<Record<string, CalendarPost[]>>((acc, p) => {
    (acc[p.date] ||= []).push(p);
    return acc;
  }, {});
  const dates = Object.keys(groups).sort();

  return (
    <Card
      title="Content Calendar"
      icon={<FiCalendar />}
      action={<button type="button" className={s.btnPrimarySm} onClick={() => openModal("addPost")}><FiPlus /> Add Post</button>}
    >
      <div className={s.toolbar}>
        <Segmented
          value={bucket}
          onChange={setBucket}
          options={[
            { value: "all", label: "All" },
            { value: "past", label: "Past" },
            { value: "today", label: isToday ? "Today" : formatShortDate(asOfDate) },
            { value: "upcoming", label: "Upcoming" },
          ]}
        />
        <select className={s.select} value={type} onChange={(e) => setType(e.target.value)} aria-label="Post type">
          <option value="all">All types</option>
          <option>Static</option>
          <option>Reel</option>
          <option>Story</option>
          <option>Carousel</option>
        </select>
      </div>
      {dates.map((d) => (
        <div key={d} className={s.dayGroup}>
          <h4>{formatDate(d)}</h4>
          <div className={s.postGrid}>
            {groups[d].map((p) => <PostCard key={p.id} p={p} />)}
          </div>
        </div>
      ))}
      {dates.length === 0 && <p className={s.empty}>No posts match this filter.</p>}
    </Card>
  );
}

export function TotalCreativesCard({ big }: { big?: boolean }) {
  const { data, setTab } = useClient();
  const { delivered, pending } = data.creatives;
  const total = delivered + pending;
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <Card title="Total Creatives" icon={<FiLayers />} action={<LinkBtn onClick={() => setTab("creatives")}>View All</LinkBtn>} className={big ? s.bigCreatives : ""}>
      <div className={s.creativesBody}>
        <Donut
          total={total}
          parts={[
            { name: "Delivered", value: delivered, color: SERIES.green },
            { name: "Pending", value: pending, color: SERIES.orange },
          ]}
        />
        <ul className={s.donutLegend}>
          <li><i style={{ background: SERIES.green }} /><strong>{delivered}</strong> Delivered <span>{pct(delivered)}%</span></li>
          <li><i style={{ background: SERIES.orange }} /><strong>{pending}</strong> Pending <span>{pct(pending)}%</span></li>
        </ul>
      </div>
    </Card>
  );
}

export function WorksCard({ full }: { full?: boolean }) {
  const { data, setTab } = useClient();
  return (
    <Card title={full ? "Works Done" : "Works"} icon={<FiImage />} action={!full && <LinkBtn onClick={() => setTab("creatives")}>View All</LinkBtn>}>
      <div className={`${s.worksGrid} ${full ? s.worksFull : ""}`}>
        {data.works.map((w) => (
          <button type="button" key={w.id} className={s.workItem} onClick={() => setTab("creatives")}>
            <Thumb src={w.image} label={w.label} />
            <span className={s.workLabel}>{w.label}</span>
            <strong className={s.workCount}>{w.count}</strong>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function RecentUploads() {
  const { data, uploadCreatives, showToast } = useClient();
  const ref = useRef<HTMLInputElement>(null);
  const images = data.files.filter((f) => /PNG|JPG|JPEG|WEBP|GIF|SVG|MP4|MOV/.test(f.type));
  return (
    <Card
      title="Recent Uploads"
      icon={<FiUpload />}
      action={<button type="button" className={s.btnPrimarySm} onClick={() => ref.current?.click()}><FiUpload /> Upload Creative</button>}
    >
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const f = Array.from(e.target.files ?? []);
          if (f.length) { uploadCreatives(f); showToast(`${f.length} creative(s) uploaded`); }
          e.target.value = "";
        }}
      />
      <div className={s.postGrid}>
        {images.map((f) => (
          <article key={f.id} className={s.postCard}>
            <div className={s.postImg}>
              <Thumb src={f.url ?? null} label={f.name} />
            </div>
            <strong className={s.postTitle} title={f.name}>{f.name}</strong>
            <span className={s.postTime}>{f.size} · {f.uploadedBy}</span>
          </article>
        ))}
        {images.length === 0 && <p className={s.empty}>No creatives uploaded yet.</p>}
      </div>
    </Card>
  );
}

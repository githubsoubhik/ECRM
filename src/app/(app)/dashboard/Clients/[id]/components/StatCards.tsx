"use client";
// Path: src/app/dashboard/Clients/[id]/components/StatCards.tsx

import { FiBarChart2, FiFileText, FiHeart, FiUsers } from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { formatINR } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import { Trend } from "./ui";
import s from "../ClientDetails.module.css";

export default function StatCards() {
  const { data } = useClient();
  const st = data.stats;

  const cards = [
    {
      key: "campaigns",
      icon: <HiOutlineSpeakerphone />,
      tone: s.icGreen,
      label: "Total Campaigns",
      value: String(st.totalCampaigns),
      trend: null,
      sub: `${st.completed} Completed | ${st.running} Running | ${st.upcoming} Upcoming`,
    },
    { key: "spend", icon: <span className={s.rupee}>₹</span>, tone: s.icBlue, label: "Total Spend", value: formatINR(st.totalSpend), trend: st.spendChange, sub: "Across all campaigns" },
    { key: "leads", icon: <FiUsers />, tone: s.icTeal, label: "Leads Generated", value: st.leads.toLocaleString("en-IN"), trend: st.leadsChange, sub: "From paid campaigns" },
    { key: "followers", icon: <FiBarChart2 />, tone: s.icPurple, label: "Followers Growth", value: `+${st.followersGrowth.toLocaleString("en-IN")}`, trend: st.followersChange, sub: "Last 30 days", hideMobile: true },
    { key: "posts", icon: <FiFileText />, tone: s.icViolet, label: "Total Posts Published", value: String(st.postsPublished), trend: null, sub: `${st.staticPosts} Static | ${st.reels} Reels`, hideMobile: true },
    { key: "engagement", icon: <FiHeart />, tone: s.icRed, label: "Engagement Rate", value: `${st.engagementRate}%`, trend: st.engagementChange, sub: `Industry avg. ${st.industryAvg}%` },
  ];

  return (
    <div className={s.stats}>
      {cards.map((c) => (
        <div key={c.key} className={`${s.statCard} ${c.hideMobile ? s.hideMobile : ""}`}>
          <span className={`${s.statIcon} ${c.tone}`}>{c.icon}</span>
          <div className={s.statBody}>
            <span className={s.statLabel}>{c.label}</span>
            <div className={s.statValueRow}>
              <strong className={s.statValue}>{c.value}</strong>
              {c.trend !== null && <Trend value={c.trend} />}
            </div>
            <span className={s.statSub}>{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

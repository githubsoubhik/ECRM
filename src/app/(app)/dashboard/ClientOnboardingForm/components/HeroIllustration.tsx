// Path: src/app/dashboard/ClientOnboardingForm/components/HeroIllustration.tsx
// Laptop + floating social icons + plant, matching the header art in the design

import { FacebookIcon, GmbIcon, InstagramIcon } from "./BrandIcons";
import { Heart, MapPin, TrendingUp } from "lucide-react";
import styles from "../ClientOnboarding.module.css";

export default function HeroIllustration() {
  return (
    <div className={styles.hero} aria-hidden>
      {/* soft background blob */}
      <div className={styles.heroBlob} />

      {/* plant */}
      <svg className={styles.heroPlant} viewBox="0 0 60 90">
        <path d="M30 60 C18 45 10 40 6 22 C20 26 28 40 30 60Z" fill="#4ade80" />
        <path d="M30 60 C40 44 50 38 54 18 C40 24 32 40 30 60Z" fill="#22c55e" />
        <path d="M30 62 C26 40 28 22 32 6 C38 24 36 42 30 62Z" fill="#16a34a" />
        <path d="M16 62 h28 l-4 26 h-20 Z" fill="#fb923c" />
        <rect x="14" y="58" width="32" height="7" rx="2" fill="#f97316" />
      </svg>

      {/* laptop */}
      <div className={styles.laptop}>
        <div className={styles.laptopScreen}>
          <span className={`${styles.floatIcon} ${styles.fi1}`}><FacebookIcon size={34} /></span>
          <span className={`${styles.floatIcon} ${styles.fi2}`}><InstagramIcon size={34} /></span>
          <span className={`${styles.floatIcon} ${styles.fi3}`}><GmbIcon size={26} /></span>
          <span className={`${styles.floatBadge} ${styles.fb1}`}><MapPin size={14} /></span>
          <span className={`${styles.floatBadge} ${styles.fb2}`}><Heart size={12} /></span>
          <svg className={styles.heroChart} viewBox="0 0 80 40">
            <polyline points="2,34 20,26 34,30 52,14 70,8" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <TrendingUp className={styles.heroArrow} size={18} />
        </div>
        <div className={styles.laptopBase} />
      </div>

      {/* bars */}
      <div className={styles.heroBars}>
        <span style={{ height: "40%" }} />
        <span style={{ height: "65%" }} />
        <span style={{ height: "90%" }} />
      </div>
    </div>
  );
}

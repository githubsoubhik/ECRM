// Path: src/app/dashboard/ClientOnboardingForm/components/InfoSidebar.tsx

import { CircleCheck, ClipboardList, Info, Lightbulb } from "lucide-react";
import styles from "../ClientOnboarding.module.css";

const tips = [
  "Provide accurate and complete information",
  "Use active social media accounts",
  "Make sure login details are correct",
  "Upload a high-quality company logo",
];

const steps = [
  { text: "Our team will review the details", color: "#3b82f6" },
  { text: "Accounts will be set up & verified", color: "#22a06b" },
  { text: "Strategy and content plan will be created", color: "#f59e0b" },
  { text: "Campaigns will be launched as per schedule", color: "#8b5cf6" },
];

export default function InfoSidebar() {
  return (
    <div className={styles.sideStack}>
      <div className={`${styles.sideCard} ${styles.sideGreen}`}>
        <span className={styles.sideBigIcon}>
          <ClipboardList size={30} />
        </span>
        <div>
          <h3 className={styles.sideTitle}>Why We Collect This Information?</h3>
          <p className={styles.sideText}>
            This helps our social media team to understand your business better, create effective strategies,
            and deliver the best results.
          </p>
        </div>
      </div>

      <div className={`${styles.sideCard} ${styles.sideBlue} ${styles.sideColumn}`}>
        <h3 className={styles.sideTitleRow}>
          <Lightbulb size={20} className={styles.bulb} /> Tips for Filling the Form
        </h3>
        <ul className={styles.tipList}>
          {tips.map((t) => (
            <li key={t}>
              <CircleCheck size={20} className={styles.tipCheck} fill="#3b82f6" color="#fff" />
              <span>{t}</span>
            </li>
          ))}
          <li>
            <Info size={20} className={styles.tipCheck} fill="#3b82f6" color="#fff" />
            <span>Our team will verify and confirm the details</span>
          </li>
        </ul>
      </div>

      <div className={`${styles.sideCard} ${styles.sideAmber} ${styles.sideColumn}`}>
        <h3 className={styles.sideTitle}>What Happens Next?</h3>
        <ol className={styles.stepList}>
          {steps.map((s, i) => (
            <li key={s.text}>
              <span className={styles.stepNum} style={{ background: s.color }}>
                {i + 1}
              </span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

"use client";
// Path: src/app/dashboard/ClientOnboardingForm/page.tsx

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, CalendarDays, CircleCheckBig, CreditCard, FileText, Image as ImageIcon,
  IndianRupee, Link2, Loader2, Mail, MapPin, Phone, Send, Settings, ShieldCheck, User, Clapperboard,
} from "lucide-react";

import {
  businessTypes, packages, paymentMethods, paymentStatuses, teamMembers,
  initialFormData, validateOnboarding,
  type FormErrors, type OnboardingFormData,
} from "../../../data/clientOnboardingData";
import { PasswordField, Section, SelectField, TextField } from "./components/FormFields";
import { FacebookIcon, GmbIcon, InstagramIcon } from "./components/BrandIcons";
import LogoUpload from "./components/LogoUpload";
import InfoSidebar from "./components/InfoSidebar";
import HeroIllustration from "./components/HeroIllustration";
import styles from "./ClientOnboarding.module.css";

type Field = keyof OnboardingFormData;
type Status = "idle" | "submitting" | "success";

export default function ClientOnboardingFormPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingFormData>(initialFormData);
  const [logo, setLogo] = useState<File | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field | "companyLogo", boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [refId, setRefId] = useState("");

  const allErrors: FormErrors = useMemo(
    () => validateOnboarding(form, logo ? { type: logo.type, size: logo.size } : null),
    [form, logo]
  );

  // Show an error only after the field was touched or the form was submitted once
  const err = (k: Field | "companyLogo") => (submitted || touched[k] ? allErrors[k] : undefined);

  const set = (k: Field) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const bind = (k: Field) => ({ id: k, value: form[k], onChange: set(k), onBlur: blur(k), error: err(k) });

  const isDirty = useMemo(
    () => !!logo || (Object.keys(form) as Field[]).some((k) => form[k] !== initialFormData[k]),
    [form, logo]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const firstError = Object.keys(allErrors)[0];
    if (firstError) {
      const el = document.getElementById(firstError === "companyLogo" ? "companyLogo" : firstError);
      const target = firstError === "companyLogo" ? el?.parentElement : el;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el && firstError !== "companyLogo") setTimeout(() => el.focus({ preventScroll: true }), 350);
      return;
    }

    setStatus("submitting");
    try {
      const body = new FormData();
      (Object.keys(form) as Field[]).forEach((k) => body.append(k, form[k].trim()));
      if (logo) body.append("companyLogo", logo);

      const res = await fetch("/api/client-onboarding", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Something went wrong. Please try again.");

      setRefId(data.id ?? "");
      setStatus("success");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  const resetForm = () => {
    setForm(initialFormData);
    setLogo(null);
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
    setRefId("");
    setServerError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("Discard the details you've entered?")) return;
    resetForm();
    router.back();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.page}>
      <form className={styles.layout} onSubmit={handleSubmit} noValidate>
        {/* ===================== MAIN FORM CARD ===================== */}
        <div className={styles.formCard}>
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Client Onboarding Form</h1>
              <p className={styles.subtitle}>Social Media Marketing</p>
              <p className={styles.intro}>
                Please fill in the details below to help our social media team understand the client better and
                start the onboarding process smoothly.
              </p>
            </div>
            <HeroIllustration />
          </header>

          {/* 1. Basic Information */}
          <Section number={1} title="Basic Information" subtitle="Provide the client and business details." icon={<User size={20} />}>
            <div className={`${styles.grid} ${styles.grid4}`}>
              <TextField {...bind("clientName")} label="Client Name" placeholder="Enter client name" icon={<User size={16} />} autoComplete="name" />
              <TextField {...bind("companyName")} label="Company Name" placeholder="Enter company name" icon={<Building2 size={16} />} autoComplete="organization" />
              <SelectField {...bind("businessType")} label="Business Type" placeholder="Select business type" options={businessTypes} />
              <TextField {...bind("clientLocation")} label="Client Location" placeholder="Enter city / location" icon={<MapPin size={16} />} />
            </div>
          </Section>

          {/* 2. Account Access Details */}
          <Section number={2} title="Account Access Details" subtitle="Provide social media and business account access." icon={<ShieldCheck size={20} />}>
            <div className={styles.accountGrid}>
              <div className={`${styles.accountPanel} ${styles.fbPanel}`}>
                <h3 className={styles.accountHead}>
                  <FacebookIcon size={26} /> Facebook Link
                </h3>
                <TextField {...bind("facebookUserId")} label="Facebook User ID" placeholder="Enter Facebook user ID" icon={<User size={16} />} autoComplete="off" />
                <PasswordField {...bind("facebookPassword")} label="Facebook Password" />
              </div>

              <div className={`${styles.accountPanel} ${styles.igPanel}`}>
                <h3 className={styles.accountHead}>
                  <InstagramIcon size={26} /> Instagram Link
                </h3>
                <TextField {...bind("instagramUserId")} label="Instagram User ID" placeholder="Enter Instagram user ID" icon={<User size={16} />} autoComplete="off" />
                <PasswordField {...bind("instagramPassword")} label="Instagram Password" />
              </div>

              <div className={`${styles.accountPanel} ${styles.gmbPanel}`}>
                <h3 className={styles.accountHead}>
                  <GmbIcon size={26} /> Google My Business
                </h3>
                <TextField {...bind("gmbLink")} type="url" inputMode="url" label="GMB Link" placeholder="Enter GMB profile link" icon={<Link2 size={16} />} />
              </div>
            </div>
          </Section>

          {/* 3 + 4 side by side on desktop */}
          <div className={styles.splitRow}>
            <Section number={3} title="Service & Timeline" subtitle="Select package and duration details." icon={<Settings size={20} />} className={styles.flex3}>
              <div className={`${styles.grid} ${styles.grid3}`}>
                <SelectField {...bind("packageDetails")} label="Package Details" placeholder="Select package" options={packages} />
                <TextField {...bind("startDate")} type="date" label="Start Date" icon={<CalendarDays size={16} />} min={today} />
                <TextField {...bind("endDate")} type="date" label="End Date" icon={<CalendarDays size={16} />} min={form.startDate || today} />
              </div>
            </Section>

            <Section number={4} title="Content Plan" subtitle="Set monthly content posting plan." icon={<FileText size={20} />} className={styles.flex2}>
              <div className={`${styles.grid} ${styles.grid2}`}>
                <TextField {...bind("totalStaticPost")} type="number" inputMode="numeric" min={0} label="Total Static Post" placeholder="Enter number" icon={<ImageIcon size={16} />} />
                <TextField {...bind("totalReelPost")} type="number" inputMode="numeric" min={0} label="Total Reel Post" placeholder="Enter number" icon={<Clapperboard size={16} />} />
              </div>
            </Section>
          </div>

          {/* 5. Payment & Assignment */}
          <Section number={5} title="Payment & Assignment" subtitle="Provide payment details and assign the project." icon={<CreditCard size={20} />}>
            <div className={`${styles.grid} ${styles.grid4}`}>
              <SelectField {...bind("paymentStatus")} label="Payment Status" placeholder="Select payment status" options={paymentStatuses} />
              <SelectField {...bind("paymentMethod")} label="Payment Method" placeholder="Select payment method" options={paymentMethods} />
              <TextField {...bind("adBudget")} type="number" inputMode="decimal" min={0} label="Ad Budget" placeholder="Enter ad budget" icon={<IndianRupee size={16} />} />
              <SelectField {...bind("assignedPerson")} label="Assigned Person" placeholder="Select team member" options={teamMembers} />
            </div>
          </Section>

          {/* 6 + 7 side by side on desktop */}
          <div className={styles.splitRow}>
            <Section number={6} title="Contact Information" subtitle="Primary contact details for communication." icon={<Phone size={20} />} className={styles.flex3}>
              <div className={`${styles.grid} ${styles.grid3}`}>
                <TextField {...bind("adminName")} label="Admins Name" placeholder="Enter admin name" icon={<User size={16} />} />
                <TextField {...bind("contactNumber")} type="tel" inputMode="tel" label="Contact Number" placeholder="Enter contact number" icon={<Phone size={16} />} autoComplete="tel" />
                <TextField {...bind("contactEmail")} type="email" inputMode="email" label="Contact Email" placeholder="Enter contact email" icon={<Mail size={16} />} autoComplete="email" />
              </div>
            </Section>

            <Section number={7} title="Company Logo" subtitle="Upload company logo for brand reference." icon={<ImageIcon size={20} />} className={styles.flex2}>
              <LogoUpload
                file={logo}
                onChange={(f) => {
                  setLogo(f);
                  setTouched((t) => ({ ...t, companyLogo: true }));
                }}
                error={err("companyLogo")}
              />
            </Section>
          </div>
        </div>

        {/* ===================== SIDEBAR ===================== */}
        <aside className={styles.aside}>
          <InfoSidebar />
        </aside>

        {/* ===================== ACTIONS ===================== */}
        <div className={styles.actions}>
          {serverError && (
            <p className={styles.serverError} role="alert">
              {serverError}
            </p>
          )}
          {submitted && Object.keys(allErrors).length > 0 && (
            <p className={styles.errorSummary} role="status">
              Please fix {Object.keys(allErrors).length} highlighted field{Object.keys(allErrors).length > 1 ? "s" : ""}.
            </p>
          )}
          <div className={styles.actionBtns}>
            <button type="button" className={styles.btnCancel} onClick={handleCancel} disabled={status === "submitting"}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={status === "submitting"}>
              {status === "submitting" ? (
                <>
                  <Loader2 size={17} className={styles.spin} /> Submitting…
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Onboarding Form
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ===================== SUCCESS MODAL ===================== */}
      {status === "success" && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="successTitle">
          <div className={styles.modal}>
            <span className={styles.modalIcon}>
              <CircleCheckBig size={40} />
            </span>
            <h2 id="successTitle" className={styles.modalTitle}>Client Onboarded!</h2>
            <p className={styles.modalText}>
              <strong>{form.companyName}</strong> has been submitted. The assigned team member will review the details
              and set up the accounts.
            </p>
            {refId && <p className={styles.modalRef}>Reference ID: <code>{refId}</code></p>}
            <div className={styles.modalBtns}>
              <button type="button" className={styles.btnCancel} onClick={() => router.push("/dashboard/Clients")}>
                Go to Clients
              </button>
              <button type="button" className={styles.btnSubmit} onClick={resetForm}>
                Onboard Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

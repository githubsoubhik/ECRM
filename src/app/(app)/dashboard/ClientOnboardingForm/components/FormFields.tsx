"use client";
// Path: src/app/dashboard/ClientOnboardingForm/components/FormFields.tsx

import { useState, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, Lock } from "lucide-react";
import type { Option } from "../../../../data/clientOnboardingData";
import styles from "../ClientOnboarding.module.css";

interface BaseProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
}

function FieldShell({ id, label, error, required = true, children }: BaseProps & { children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label} {required && <span className={styles.req}>*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: ReactNode;
  type?: "text" | "email" | "tel" | "number" | "url" | "date";
  min?: string | number;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url";
  autoComplete?: string;
}

export function TextField({
  id, label, error, required, value, onChange, onBlur, placeholder, icon,
  type = "text", min, inputMode, autoComplete,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} required={required}>
      <div className={`${styles.inputWrap} ${error ? styles.hasError : ""} ${type === "date" && !value ? styles.dateEmpty : ""}`}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          min={min}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={styles.input}
        />
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps extends BaseProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: Option[];
  placeholder: string;
}

export function SelectField({ id, label, error, required, value, onChange, onBlur, options, placeholder }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} required={required}>
      <div className={`${styles.inputWrap} ${error ? styles.hasError : ""}`}>
        <select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${styles.input} ${styles.select} ${!value ? styles.placeholderSelect : ""}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.selectChevron} aria-hidden />
      </div>
    </FieldShell>
  );
}

interface PasswordFieldProps extends BaseProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}

export function PasswordField({ id, label, error, required, value, onChange, onBlur }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} required={required}>
      <div className={`${styles.inputWrap} ${error ? styles.hasError : ""}`}>
        <span className={styles.inputIcon}>
          <Lock size={16} />
        </span>
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          placeholder="Enter password"
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${styles.input} ${styles.withTrailing}`}
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </FieldShell>
  );
}

interface SectionProps {
  number: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Section({ number, title, subtitle, icon, className = "", children }: SectionProps) {
  return (
    <section className={`${styles.section} ${className}`} aria-labelledby={`section-${number}`}>
      <header className={styles.sectionHead}>
        <span className={styles.sectionIcon}>{icon}</span>
        <div>
          <h2 id={`section-${number}`} className={styles.sectionTitle}>
            {number}. {title}
          </h2>
          <p className={styles.sectionSub}>{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

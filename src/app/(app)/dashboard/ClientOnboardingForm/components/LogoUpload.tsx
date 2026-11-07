"use client";
// Path: src/app/dashboard/ClientOnboardingForm/components/LogoUpload.tsx

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CloudUpload, FileImage, X } from "lucide-react";
import styles from "../ClientOnboarding.module.css";

interface LogoUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function LogoUpload({ file, onChange, error }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (files: FileList | null) => {
    if (files && files[0]) onChange(files[0]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>
        Upload Company Logo <span className={styles.req}>*</span>
      </span>

      {file && preview ? (
        <div className={`${styles.logoPreview} ${error ? styles.hasErrorBox : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Company logo preview" className={styles.logoThumb} />
          <div className={styles.logoMeta}>
            <span className={styles.logoName} title={file.name}>
              <FileImage size={14} /> {file.name}
            </span>
            <span className={styles.logoSize}>{formatSize(file.size)}</span>
            <button type="button" className={styles.logoChange} onClick={() => inputRef.current?.click()}>
              Change
            </button>
          </div>
          <button
            type="button"
            className={styles.logoRemove}
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Remove logo"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${error ? styles.hasErrorBox : ""}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-describedby={error ? "companyLogo-error" : undefined}
        >
          <CloudUpload size={30} className={styles.dropIcon} />
          <div>
            <p className={styles.dropTitle}>Click to upload or drag &amp; drop</p>
            <p className={styles.dropHint}>PNG, JPG, SVG (Max 5 MB)</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id="companyLogo"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className={styles.hiddenInput}
        onChange={(e) => pick(e.target.files)}
      />
      {error && (
        <p id="companyLogo-error" className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

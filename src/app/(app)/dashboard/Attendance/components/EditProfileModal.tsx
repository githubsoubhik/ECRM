'use client';

// src/app/dashboard/Attendance/components/EditProfileModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Trash2, Upload, X } from 'lucide-react';
import styles from '../mark/mark.module.css';
import { Employee } from '@/app/data/employeeData';

interface Props {
  employee: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

export default function EditProfileModal({ employee, onClose, onSave }: Props) {
  const [form, setForm] = useState<Employee>(employee);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const set = (key: keyof Employee, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const pickPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a valid image file (JPG or PNG).');
    if (file.size > 3 * 1024 * 1024) return setError('Keep the photo under 3 MB.');

    const reader = new FileReader();
    reader.onload = () => {
      setPendingPhoto(String(reader.result));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (pendingPhoto !== null) {
      const updated = { ...form, photoUrl: pendingPhoto };
      setForm(updated);
      setPendingPhoto(null);
      onSave(updated); // Saves the photo update immediately
    }
  };

  const removePhoto = () => {
    setPendingPhoto(null);
    const updated = { ...form, photoUrl: '' };
    setForm(updated);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
    setError(null);
    onSave(updated); // Instantly updates profile state to show initial fallback
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.id.trim()) return setError('Employee ID is required.');
    
    // Apply pending photo if user submits form without clicking "Save photo" first
    const finalPhoto = pendingPhoto !== null ? pendingPhoto : form.photoUrl;
    onSave({ ...form, photoUrl: finalPhoto, name: form.name.trim(), id: form.id.trim().toUpperCase() });
  };

  const displayedPhoto = pendingPhoto !== null ? pendingPhoto : form.photoUrl;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <div className={styles.modalHead}>
          <h2 id="edit-profile-title" className={styles.modalTitle}>Edit profile</h2>
          <button type="button" className={styles.roundBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className={styles.modalBody}>
            {/* Photo Section with Upload, Save Photo, and Delete Photo */}
            <div className={styles.photoRow}>
              <span className={styles.avatar}>
                {displayedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayedPhoto} alt="Employee Avatar" className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarFallback}>{form.name.charAt(0) || 'E'}</span>
                )}
              </span>

              <div className={styles.photoActions}>
                <div className={styles.btnGroup}>
                  {/* Select File / Change Photo */}
                  <button type="button" className={styles.ghostBtn} onClick={() => fileRef.current?.click()}>
                    <Upload size={16} />
                    {displayedPhoto ? 'Change photo' : 'Upload photo'}
                  </button>

                  {/* Save Photo (Shown when a new photo is chosen) */}
                  {pendingPhoto !== null && (
                    <button type="button" className={styles.savePhotoBtn} onClick={handleSavePhoto}>
                      <Check size={16} />
                      Save photo
                    </button>
                  )}

                  {/* Delete Photo */}
                  {Boolean(displayedPhoto) && (
                    <button type="button" className={styles.dangerBtn} onClick={removePhoto}>
                      <Trash2 size={16} />
                      Delete photo
                    </button>
                  )}
                </div>
                <p className={styles.fieldHint}>JPG or PNG, up to 3 MB.</p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.hidden}
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
            </div>

            {/* Form Fields */}
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Full name</span>
                <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Employee ID</span>
                <input className={styles.input} value={form.id} onChange={(e) => set('id', e.target.value)} />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Designation</span>
                <input className={styles.input} value={form.designation} onChange={(e) => set('designation', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Team</span>
                <input className={styles.input} value={form.team} onChange={(e) => set('team', e.target.value)} />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Office location</span>
              <input
                className={styles.input}
                value={form.officeLocation}
                onChange={(e) => set('officeLocation', e.target.value)}
              />
            </label>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Work email</span>
                <input className={styles.input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Shift starts</span>
                <input className={styles.input} type="time" value={form.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} />
              </label>
            </div>

            {error && <p className={styles.formError} role="alert">{error}</p>}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.ghostBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.primaryBtn}>Save changes</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
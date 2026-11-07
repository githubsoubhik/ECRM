"use client";

// src/app/dashboard/Team/page.tsx
// Team directory. Members come from EMPLOYEE_DB + members the admin added
// (with saved profile edits), and today's status comes live from the attendance history.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code,
  Coins,
  HardHat,
  LayoutGrid,
  List,
  Mail,
  Megaphone,
  MoreHorizontal,
  Palette,
  Phone,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DEMO_ON_LEAVE_TODAY,
  DEPARTMENT_ORDER,
  EMPLOYEE_DB,
  OFFICE_LOCATIONS,
  TEAM_STATUSES,
  TEAM_STATUS_META,
  addEmployee,
  buildTeam,
  departmentCounts,
  departmentOf,
  loadRemovedIds,
  loadHistory,
  loadLeaveIds,
  nextEmployeeId,
  normalizeIndianPhone,
  isAddedEmployee,
  removeEmployee,
  restoreEmployee,
  restoreRemovedEmployees,
  setTempStatus,
  saveLeaveIds,
  teamSummary,
  type Employee,
  type TeamMember,
  type TeamStatus,
} from "../../../data/employeeData";
import styles from "./Team.module.css";

import {fetchWithAuth} from '../../../../../lib/fetchWithAuth.js';

/* ------------------------------------------------------------------ */
/* Look-up tables                                                      */
/* ------------------------------------------------------------------ */








const DEPT_STYLE: Record<string, { icon: LucideIcon; color: string; soft: string }> = {
  Management: { icon: Users, color: "#2563eb", soft: "#eaf1fe" },
  "Human Resources": { icon: User, color: "#e11d48", soft: "#fdecef" },
  Marketing: { icon: Megaphone, color: "#16a34a", soft: "#e8f7ee" },
  Creative: { icon: Palette, color: "#9333ea", soft: "#f4ecfd" },
  Technology: { icon: Code, color: "#2563eb", soft: "#e8f0fe" },
  Sales: { icon: TrendingUp, color: "#ea580c", soft: "#fef1e6" },
  Operations: { icon: Settings, color: "#0d9488", soft: "#e6f7f5" },
  Finance: { icon: Coins, color: "#ca8a04", soft: "#fdf6e3" },
  Construction: { icon: HardHat, color: "#b45309", soft: "#f8efe6" },
  "Business Development": { icon: BarChart3, color: "#db2777", soft: "#fdecf4" },
};
const DEPT_FALLBACK = { icon: Users, color: "#475569", soft: "#eef1f5" };

// Server-safe first render (no localStorage), replaced right after mount.
const INITIAL_TEAM: TeamMember[] = EMPLOYEE_DB.map((e) => ({
  ...e,
  department: departmentOf(e),
  phone: e.phone ?? "",
  status: DEMO_ON_LEAVE_TODAY.includes(e.id) ? "On Leave" : "Absent",
}));

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");



function useIsMobile(breakpoint = 767) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}







/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

// function Avatar({ member, size }: { member: TeamMember; size: number }) {
//   const [failed, setFailed] = useState(false);


//  console.log("members........photo", member.photoUrl);


//   return (
//     <div className={styles.avatar} style={{ width: size, height: size }}>
//       {!failed && member.photoUrl ? (
//         // eslint-disable-next-line @next/next/no-img-element
//         <img src={member.photoUrl} alt={member.name} onError={(e) =>  {console.error("Image failed to load:", member.photoUrl, e); setFailed(true)}} />
      
//       ) : (
//         <span style={{ fontSize: size * 0.34 }}>{initials(member.name)} </span>
       
//       )}
//     </div>
//   );
// }

function Avatar({ member, size }: { member: TeamMember; size: number }) {
  const [failed, setFailed] = useState(false);

  // reset if the photo URL changes (e.g. after a refresh)
  useEffect(() => {
    setFailed(false);
  }, [member.photoUrl]);

  return (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      {!failed && member.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoUrl}
          alt={member.name}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.34 }}>{initials(member.name)}</span>
      )}
    </div>
  );
}


function StatusBadge({ status }: { status: TeamStatus }) {
  const meta = TEAM_STATUS_META[status];
  return (
    <span className={styles.badge} style={{ color: meta.color, background: meta.soft }}>
      <i style={{ background: meta.color }} />
      {status}
    </span>
  );
}

function Select({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: string[];
}) {
  return (
    <label className={styles.select}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={allLabel}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} />
    </label>
  );
}

function MemberMenu({
  member,
  open,
  onToggle,
  onLeaveToggle,
  onRemove,
}: {
  member: TeamMember;
  open: boolean;
  onToggle: () => void;
  onLeaveToggle: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className={styles.menuWrap} data-menu>
      <button className={styles.menuBtn} onClick={onToggle} aria-label={`Actions for ${member.name}`} aria-expanded={open}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <a href={`mailto:${member.email}`} role="menuitem">
            <Mail size={15} /> Send email
          </a>
          {member.phone && (
            <a href={`tel:${member.phone.replace(/\s/g, "")}`} role="menuitem">
              <Phone size={15} /> Call
            </a>
          )}
          <button role="menuitem" onClick={onLeaveToggle}>
            <UserMinus size={15} /> {member.status === "On Leave" ? "Remove leave" : "Mark on leave"}
          </button>
          {onRemove && (
            <button role="menuitem" className={styles.danger} onClick={onRemove}>
              <Trash2 size={15} /> Remove member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Solid icons, as in the design
const MailSolid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.4 5.6A2.5 2.5 0 0 1 4.5 4.5h15a2.5 2.5 0 0 1 2.1 1.1L12 12.2 2.4 5.6Z" />
    <path d="M2 7.9V17a2.5 2.5 0 0 0 2.5 2.5h15A2.5 2.5 0 0 0 22 17V7.9l-9.43 6.47a1 1 0 0 1-1.14 0L2 7.9Z" />
  </svg>
);
const PhoneSolid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
  </svg>
);

function MemberCard({
  member,
  view,
  menuOpen,
  onMenuToggle,
  onLeaveToggle,
  onRemove,
}: {
  member: TeamMember;
  view: "grid" | "list";
  menuOpen: boolean;
  onMenuToggle: () => void;
  onLeaveToggle: () => void;
  onRemove?: () => void;
}) {
  const contact = (
    <div className={styles.contact}>
      <a href={`mailto:${member.email}`} title={member.email}>
        <MailSolid />
        <span>{member.email}</span>
      </a>
      {member.phone && (
        <a href={`tel:${member.phone.replace(/\s/g, "")}`}>
          <PhoneSolid />
          <span>{member.phone}</span>
        </a>
      )}
    </div>
  );

  return (
    <article className={`${styles.card} ${view === "list" ? styles.cardList : styles.cardGrid}`}>
      <Avatar member={member} size={view === "list" ? 64 : 58} />
      <div className={styles.cardTop}>
        <StatusBadge status={member.status} />
      </div>
      <MemberMenu member={member} open={menuOpen} onToggle={onMenuToggle} onLeaveToggle={onLeaveToggle} onRemove={onRemove} />
      <div className={styles.info}>
        <h3>{member.name}</h3>
        <p className={styles.role}>{member.designation}</p>
        <p className={styles.memberDept}>{member.department}</p>
      </div>
      {contact}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Add Member (admin)                                                  */
/* ------------------------------------------------------------------ */

type InitialStatus = "Absent" | "Present" | "On Leave";

interface MemberForm {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  department: string;
  designation: string;
  profileImage: string;
}

type FormErrors = Partial<Record<keyof MemberForm | "form", string>>;

const OTHER_DEPT = "__other";

// Crops the photo to a square and shrinks it to 256px, so it stays small in storage.
async function resizePhoto(file: File, size = 256): Promise<string> {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unreadable image"));
      img.src = src;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(src);
  }
}

const DEPARTMENTS = [
  "Social Media",
  "Graphics Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Web Development",
] as const;

const ROLES = ["Super Admin", "Admin", "Hr", "employee", "staff"] as const;

interface MemberForm {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  department: string;
  designation: string;
  profileImage: string;
}

// type FormErrors = Partial<Record<keyof MemberForm | "form", string>>;





// function AddMemberModal({
//   departments,
//   designations,
//   onClose,
//   onAdded,
// }: {
//   departments?: string[];
//   designations?: string[];
//   onClose: () => void;
//   onAdded: (employee: any) => void;
// }) {
//   const [form, setForm] = useState<MemberForm>({
//     employeeId: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     password: "",
//     role: "employee",
//     department: DEPARTMENTS[0],
//     designation: "",
//     profileImage: "",
//   });

//   const [errors, setErrors] = useState<FormErrors>({});
//   const [photoBusy, setPhotoBusy] = useState(false);
//   const fileRef = useRef<HTMLInputElement>(null);
//   const firstFieldRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     firstFieldRef.current?.focus();
//     const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     document.body.style.overflow = "hidden";
//     return () => {
//       window.removeEventListener("keydown", onKey);
//       document.body.style.overflow = "";
//     };
//   }, [onClose]);

//   const set = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) => {
//     setForm((f) => ({ ...f, [key]: value }));
//     setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
//   };

//   const pickPhoto = async (file?: File) => {
//     if (!file) return;
//     if (!file.type.startsWith("image/")) {
//       setErrors((e) => ({
//         ...e,
//         profileImage: "Please choose an image file (JPG, PNG, WebP).",
//       }));
//       return;
//     }

//     setPhotoBusy(true);
//     try {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         set("profileImage", event.target?.result as string);
//         setPhotoBusy(false);
//       };
//       reader.readAsDataURL(file);
//     } catch {
//       setErrors((e) => ({
//         ...e,
//         profileImage: "Couldn't read that image. Try another one.",
//       }));
//       setPhotoBusy(false);
//     } finally {
//       if (fileRef.current) fileRef.current.value = "";
//     }
//   };

//   const validate = (): boolean => {
//     const e: FormErrors = {};

//     if (!form.employeeId.trim()) {
//       e.employeeId = "Employee ID is required.";
//     }
//     if (!form.firstName.trim()) {
//       e.firstName = "First name is required.";
//     }
//     if (!form.lastName.trim()) {
//       e.lastName = "Last name is required.";
//     }
//     if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
//       e.email = "Please provide a valid email address.";
//     }
//     if (!form.password || form.password.length < 6) {
//       e.password = "Password must be at least 6 characters.";
//     }
//     if (!form.role) {
//       e.role = "Role is required.";
//     }
//     if (!form.department) {
//       e.department = "Department is required.";
//     }
//     if (!form.designation.trim()) {
//       e.designation = "Designation is required.";
//     }

//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const [submitting, setSubmitting] = useState(false);

//   const submit = async (ev: React.FormEvent) => {
//     ev.preventDefault();

//     // 1. Run local form validations
//     if (!validate()) return;

//     setSubmitting(true);
//     setErrors((e) => ({ ...e, form: undefined }));

    
//     const payload = {
//       employeeId: form.employeeId.trim().toUpperCase(),
//       firstName: form.firstName.trim(),
//       lastName: form.lastName.trim(),
//       email: form.email.trim().toLowerCase(),
//       password: form.password,
//       phone: form.phone.trim(),
//       role: form.role,
//       department: form.department,
//       designation: form.designation.trim(),
//       profileImage: form.profileImage || "/imageUploads/Sana-Dark-Royal-Background_1875X2500.webp",
//       status: "Active",
//     };

//     try {
      
//       const res = await fetchWithAuth("/api/regemployee", {
//         method: "POST",
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || data.error || "Failed to create employee.");
//       }

     
//       onAdded(data.employee || data.data || payload);
//       onClose();
//     } catch (err: any) {
//       console.error("Registration error:", err);
//       setErrors((prev) => ({
//         ...prev,
//         form: err.message || "Network error. Please try again.",
//       }));
//     } finally {
//       setSubmitting(false);
//     }
//   };
//   const err = (key: keyof FormErrors) =>
//     errors[key] ? <span className={styles.fieldError}>{errors[key]}</span> : null;
//   const cls = (key: keyof FormErrors) => (errors[key] ? styles.invalid : undefined);




//   return (
//     <div className={styles.overlay} onMouseDown={onClose}>
//       <form
//         className={styles.modal}
//         onMouseDown={(e) => e.stopPropagation()}
//         onSubmit={submit}
//         noValidate
//         aria-labelledby="add-member-title"
//       >
//         <div className={styles.modalHead}>
//           <div>
//             <h2 id="add-member-title">Add New Member</h2>
//             <p>Fill in the required employee schema details.</p>
//           </div>
//           <button type="button" onClick={onClose} aria-label="Close">
//             <X size={18} />
//           </button>
//         </div>

//         <div className={styles.modalBody}>
//           {/* Profile Photo */}
//           <div className={`${styles.full} ${styles.photoRow}`}>
//             <button
//               type="button"
//               className={styles.photoPick}
//               onClick={() => fileRef.current?.click()}
//               aria-label="Upload photo"
//             >
//               {form.profileImage ? (
//                 <img
//                   src={form.profileImage}
//                   alt="Avatar Preview"
//                   style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover" }}
//                 />
//               ) : (
//                 <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#ddd" }} />
//               )}
//               <span className={styles.photoBadge}>
//                 <Camera size={14} />
//               </span>
//             </button>
//             <div className={styles.photoInfo}>
//               <strong>
//                 {form.firstName || form.lastName
//                   ? `${form.firstName} ${form.lastName}`.trim()
//                   : "New Member"}
//               </strong>
//               <span>{form.designation || "Designation"}</span>
//               <span className={styles.muted}>{form.department}</span>
//               <div className={styles.photoActions}>
//                 <button
//                   type="button"
//                   className={styles.linkBtn}
//                   onClick={() => fileRef.current?.click()}
//                   disabled={photoBusy}
//                 >
//                   {photoBusy ? "Processing…" : form.profileImage ? "Change photo" : "Upload photo"}
//                 </button>
//                 {form.profileImage && (
//                   <button
//                     type="button"
//                     className={`${styles.linkBtn} ${styles.linkMuted}`}
//                     onClick={() => set("profileImage", "")}
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//               {err("profileImage")}
//             </div>
//             <input
//               ref={fileRef}
//               type="file"
//               accept="image/*"
//               hidden
//               onChange={(e) => pickPhoto(e.target.files?.[0])}
//             />
//           </div>

//           <h3 className={styles.full}>Identity & Credentials</h3>
//           <label>
//             <span>Employee ID <b>*</b></span>
//             <input
//               ref={firstFieldRef}
//               className={cls("employeeId")}
//               value={form.employeeId}
//               onChange={(e) => set("employeeId", e.target.value.toUpperCase())}
//               placeholder="e.g. EMP001"
//             />
//             {err("employeeId")}
//           </label>

//           <label>
//             <span>Password <b>*</b></span>
//             <input
//               type="password"
//               className={cls("password")}
//               value={form.password}
//               onChange={(e) => set("password", e.target.value)}
//               placeholder="Min. 6 characters"
//             />
//             {err("password")}
//           </label>

//           <label>
//             <span>First Name <b>*</b></span>
//             <input
//               className={cls("firstName")}
//               value={form.firstName}
//               onChange={(e) => set("firstName", e.target.value)}
//               placeholder="e.g. Riya"
//             />
//             {err("firstName")}
//           </label>

//           <label>
//             <span>Last Name <b>*</b></span>
//             <input
//               className={cls("lastName")}
//               value={form.lastName}
//               onChange={(e) => set("lastName", e.target.value)}
//               placeholder="e.g. Sen"
//             />
//             {err("lastName")}
//           </label>

//           <h3 className={styles.full}>Contact Details</h3>
//           <label>
//             <span>Work Email <b>*</b></span>
//             <input
//               type="email"
//               className={cls("email")}
//               value={form.email}
//               onChange={(e) => set("email", e.target.value)}
//               placeholder="name@company.com"
//             />
//             {err("email")}
//           </label>

//           <label>
//             <span>Phone</span>
//             <input
//               type="tel"
//               className={cls("phone")}
//               value={form.phone}
//               onChange={(e) => set("phone", e.target.value)}
//               placeholder="+91 9876543210"
//             />
//             {err("phone")}
//           </label>

//           <h3 className={styles.full}>Role & Assignment</h3>
//           <label>
//             <span>Role <b>*</b></span>
//             <select
//               className={cls("role")}
//               value={form.role}
//               onChange={(e) => set("role", e.target.value)}
//             >
//               {ROLES.map((r) => (
//                 <option key={r} value={r}>
//                   {r}
//                 </option>
//               ))}
//             </select>
//             {err("role")}
//           </label>

//           <label>
//             <span>Department <b>*</b></span>
//             <select
//               className={cls("department")}
//               value={form.department}
//               onChange={(e) => set("department", e.target.value)}
//             >
//               {DEPARTMENTS.map((d) => (
//                 <option key={d} value={d}>
//                   {d}
//                 </option>
//               ))}
//             </select>
//             {err("department")}
//           </label>

//           <label className={styles.full}>
//             <span>Designation <b>*</b></span>
//             <input
//               className={cls("designation")}
//               value={form.designation}
//               onChange={(e) => set("designation", e.target.value)}
//               placeholder="e.g. Senior Frontend Developer"
//             />
//             {err("designation")}
//           </label>

//           {errors.form && <p className={`${styles.full} ${styles.formError}`}>{errors.form}</p>}
//         </div>

//         <div className={styles.modalActions}>
//           <button type="button" className={styles.ghostBtn} onClick={onClose}>
//             Cancel
//           </button>
//           <button type="submit" className={styles.primaryBtn} disabled={photoBusy}>
//             <Plus size={17} /> Add New Member
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

function AddMemberModal({
  departments,
  designations,
  onClose,
  onAdded,
    setRefreshCounter
}: {
  departments?: string[];
  designations?: string[];
  onClose: () => void;
  onAdded: (employee: any) => void;
    setRefreshCounter: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [form, setForm] = useState<MemberForm>({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "employee",
    department: DEPARTMENTS[0],
    designation: "",
    profileImage: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const pickPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({
        ...e,
        profileImage: "Please choose an image file (JPG, PNG, WebP).",
      }));
      return;
    }

    setPhotoBusy(true);
    setSelectedFile(file);

    // Fast local memory preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPhotoBusy(false);

    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    set("profileImage", "");
  };

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.employeeId.trim()) {
      e.employeeId = "Employee ID is required.";
    }
    if (!form.firstName.trim()) {
      e.firstName = "First name is required.";
    }
    if (!form.lastName.trim()) {
      e.lastName = "Last name is required.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      e.email = "Please provide a valid email address.";
    }
    if (!form.password || form.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    if (!form.role) {
      e.role = "Role is required.";
    }
    if (!form.department) {
      e.department = "Department is required.";
    }
    if (!form.designation.trim()) {
      e.designation = "Designation is required.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setErrors((e) => ({ ...e, form: undefined }));

    // Prepare Multipart FormData for Multer
    const formData = new FormData();
    formData.append("employeeId", form.employeeId.trim().toUpperCase());
    formData.append("firstName", form.firstName.trim());
    formData.append("lastName", form.lastName.trim());
    formData.append("email", form.email.trim().toLowerCase());
    formData.append("password", form.password);
    formData.append("phone", form.phone.trim());
    formData.append("role", form.role);
    formData.append("department", form.department);
    formData.append("designation", form.designation.trim());
    formData.append("status", "Active");

    // Append the file if chosen
    if (selectedFile) {
      formData.append("profileImage", selectedFile);
    }
      try {
        // No headers: the cookie is sent automatically and the browser sets the multipart boundary.
        const res = await fetchWithAuth("/api/regemployee", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || data.error || `Failed (${res.status})`);
        }

        onAdded(data.employee || data.data || {});
        onClose();
        setRefreshCounter((c) => c + 1);
      } catch (err: any) {
        console.error("Registration error:", err);
        setErrors((prev) => ({ ...prev, form: err.message || "Network error. Please try again." }));
      } finally {
        setSubmitting(false);
      }
  };

  const err = (key: keyof FormErrors) =>
    errors[key] ? <span className={styles.fieldError}>{errors[key]}</span> : null;
  const cls = (key: keyof FormErrors) => (errors[key] ? styles.invalid : undefined);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <form
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
        aria-labelledby="add-member-title"
      >
        <div className={styles.modalHead}>
          <div>
            <h2 id="add-member-title">Add New Member</h2>
            <p>Fill in the required employee schema details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Profile Photo */}
          <div className={`${styles.full} ${styles.photoRow}`}>
            <button
              type="button"
              className={styles.photoPick}
              onClick={() => fileRef.current?.click()}
              aria-label="Upload photo"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#ddd" }} />
              )}
              <span className={styles.photoBadge}>
                <Camera size={14} />
              </span>
            </button>
            <div className={styles.photoInfo}>
              <strong>
                {form.firstName || form.lastName
                  ? `${form.firstName} ${form.lastName}`.trim()
                  : "New Member"}
              </strong>
              <span>{form.designation || "Designation"}</span>
              <span className={styles.muted}>{form.department}</span>
              <div className={styles.photoActions}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy || submitting}
                >
                  {photoBusy ? "Processing…" : previewUrl ? "Change photo" : "Upload photo"}
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    className={`${styles.linkBtn} ${styles.linkMuted}`}
                    onClick={removePhoto}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                )}
              </div>
              {err("profileImage")}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>

          <h3 className={styles.full}>Identity & Credentials</h3>
          <label>
            <span>Employee ID <b>*</b></span>
            <input
              ref={firstFieldRef}
              className={cls("employeeId")}
              value={form.employeeId}
              onChange={(e) => set("employeeId", e.target.value.toUpperCase())}
              placeholder="e.g. EMP001"
            />
            {err("employeeId")}
          </label>

          <label>
            <span>Password <b>*</b></span>
            <input
              type="password"
              className={cls("password")}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min. 6 characters"
            />
            {err("password")}
          </label>

          <label>
            <span>First Name <b>*</b></span>
            <input
              className={cls("firstName")}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="e.g. Riya"
            />
            {err("firstName")}
          </label>

          <label>
            <span>Last Name <b>*</b></span>
            <input
              className={cls("lastName")}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="e.g. Sen"
            />
            {err("lastName")}
          </label>

          <h3 className={styles.full}>Contact Details</h3>
          <label>
            <span>Work Email <b>*</b></span>
            <input
              type="email"
              className={cls("email")}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@company.com"
            />
            {err("email")}
          </label>

          <label>
            <span>Phone</span>
            <input
              type="tel"
              className={cls("phone")}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 9876543210"
            />
            {err("phone")}
          </label>

          <h3 className={styles.full}>Role & Assignment</h3>
          <label>
            <span>Role <b>*</b></span>
            <select
              className={cls("role")}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {err("role")}
          </label>

          <label>
            <span>Department <b>*</b></span>
            <select
              className={cls("department")}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {err("department")}
          </label>

          <label className={styles.full}>
            <span>Designation <b>*</b></span>
            <input
              className={cls("designation")}
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
            />
            {err("designation")}
          </label>

          {errors.form && <p className={`${styles.full} ${styles.formError}`}>{errors.form}</p>}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryBtn} disabled={photoBusy || submitting}>
            <Plus size={17} /> {submitting ? "Uploading & Adding..." : "Add New Member"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmRemoveModal({
  member,
  onCancel,
  onConfirm,
}: {
  member: TeamMember;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onMouseDown={onCancel}>
      <div
        className={styles.confirm}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className={styles.confirmIcon}>
          <Trash2 size={22} />
        </span>
        <h2 id="remove-title">Remove {member.name}?</h2>
        <div className={styles.confirmMember}>
          <Avatar member={member} size={44} />
          <div>
            <strong>{member.name}</strong>
            <span>
              {member.designation} · {member.department}
            </span>
          </div>
        </div>
        <p>They will be removed from the Team page and the counts.</p>
        <p className={styles.demoNote}>Demo mode: everyone comes back when the page is reloaded.</p>
        <div className={styles.confirmActions}>
          <button ref={cancelRef} type="button" className={styles.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.dangerBtn} onClick={onConfirm}>
            <Trash2 size={16} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; undoId?: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);

const toPhotoUrl = (p?: string) => {
  if (!p) return "";
  let clean = p.replace(/\\/g, "/");
  // strip the backend origin so it goes through the Next proxy
  clean = clean.replace(/^https?:\/\/[^/]+/i, "");
  return clean.startsWith("/") ? clean : `/${clean}`;
};



  useEffect(() => {
  async function fetchTeam() {
    try {
      const res = await fetchWithAuth('/api/getAllEmployee');

      const result = await res.json();

      // console.log("fetched", result);

      const members = result.data.map((emp: any) => ({
        id: emp.employeeId,

        name: `${emp.firstName} ${emp.lastName}`,

        designation: emp.designation,

        team: `${emp.department} Team`,

        department: emp.department,

        officeLocation: "PAVION Office - Kolkata",

        //  photoUrl: emp.profileImage || "",

       photoUrl: emp.profileImage
        ? /^https?:\/\//i.test(emp.profileImage)
          ? emp.profileImage
          : `${process.env.NEXT_PUBLIC_API_URL || "http://192.168.200.161:5000"}${
              emp.profileImage.startsWith("/") ? "" : "/"
            }${emp.profileImage}`
        : "",


      // PhotoUrl:  toPhotoUrl(emp.profileImage),

        email: emp.email,

        phone: emp.phone,

        shiftStart: "09:30",
            

        status:
          emp.status === "Active"
            ? "Absent"
            : "Absent",
      }));

      setTeam(members);

  //console.log("profileImage", members);

    } catch (error) {
      console.log("Employee API Error", error);
    }
  }


  fetchTeam();
      //  console.log("url", team);

      

}, [refreshCounter]);





  // Close the "..." menu on outside click.
  useEffect(() => {
    if (!menuFor) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-menu]")) setMenuFor(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuFor]);

  const summary = useMemo(() => teamSummary(team), [team]);
  const departments = useMemo(() => departmentCounts(team), [team]);
  const designations = useMemo(() => [...new Set(team.map((m) => m.designation))].sort(), [team]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team.filter(
      (m) =>
        (!q || [m.name, m.department, m.designation, m.email].some((v) => v.toLowerCase().includes(q))) &&
        (!department || m.department === department) &&
        (!designation || m.designation === designation) &&
        (!status || m.status === status) 
    );
  }, [team, query, department, designation, status]);

  const activeFilters = [department, designation, status].filter(Boolean).length;

  // How many employees are currently removed (for the "Restore" link).
  const removedCount = useMemo(() => (team.length ? loadRemovedIds().length : 0), [team]);

  const toggleLeave = (member: TeamMember) => {
    if (isAddedEmployee(member.id)) {
      setTempStatus(member.id, member.status === "On Leave" ? "Absent" : "On Leave");
      refreshTeam();
      setMenuFor(null);
      return;
    }
    const ids = loadLeaveIds();
    const next = ids.includes(member.id) ? ids.filter((id) => id !== member.id) : [...ids, member.id];
    saveLeaveIds(next);
    setTeam(buildTeam(loadHistory(), next));
    setMenuFor(null);
  };

  const refreshTeam = () => setTeam(buildTeam(loadHistory(), loadLeaveIds()));

  const closeAdd = useCallback(() => setAddOpen(false), []);

  const memberAdded = (employee: Employee) => {
    setAddOpen(false);
    clearFilters();
    refreshTeam();
    setToast({ text: `${employee.name} was added (until the page reloads).` });
    // bring the new card into view (it's added at the end)
    window.setTimeout(() => listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const askRemove = (member: TeamMember) => {
    setMenuFor(null);
    setConfirmRemove(member);
  };

  const confirmRemoval = () => {
    if (!confirmRemove) return;
    removeEmployee(confirmRemove.id); // in memory only — a reload brings them back
    refreshTeam();
    setToast({ text: `${confirmRemove.name} was removed.`, undoId: confirmRemove.id });
    setConfirmRemove(null);
  };

  const undoRemove = (id: string) => {
    restoreEmployee(id);
    refreshTeam();
    setToast(null);
  };

  const restoreRemoved = () => {
    restoreRemovedEmployees();
    refreshTeam();
    setToast({ text: "Removed employees were restored." });
  };

  // Hide the confirmation after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.undoId ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const pickDepartment = (name: string) => {
    setDepartment((d) => (d === name ? "" : name));
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setQuery("");
    setDepartment("");
    setDesignation("");
    setStatus("");
  };

  const effectiveView = isMobile ? "list" : view;

  const stats: { label: string; value: number; icon: LucideIcon; color: string; soft: string; filter: string }[] = [
    { label: "Total Employees", value: summary.total, icon: Users, color: "#2563eb", soft: "#eaf1fe", filter: "" },
    { label: "Present Today", value: summary.present, icon: UserCheck, color: "#16a34a", soft: "#e8f7ee", filter: "Present" },
    { label: "On Leave", value: summary.onLeave, icon: UserMinus, color: "#f59e0b", soft: "#fff3df", filter: "On Leave" },
    { label: "Absent Today", value: summary.absent, icon: UserX, color: "#ef4444", soft: "#fdecec", filter: "Absent" },
  ];

  const filterSelects = (
    <>
      <Select value={department} onChange={setDepartment} allLabel="All Departments" options={departments.map((d) => d.name)} />
      <Select value={designation} onChange={setDesignation} allLabel="All Designations" options={designations} />
      <Select value={status} onChange={setStatus} allLabel="All Status" options={TEAM_STATUSES} />
    </>
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <ChevronRight size={14} />
        <span>Team</span>
      </nav>

      <header className={styles.header}>
        <div>
          <h1>Our Team</h1>
          <p>
            Meet your colleagues and stay connected.
            <span className={styles.hideMobile}> Collaborate for a stronger tomorrow.</span>
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setAddOpen(true)}>
          <Plus size={18} /> Add Member
        </button>
      </header>

      {/* Summary */}
      <section className={styles.stats}>
        {stats.map((s) => (
          <button
            key={s.label}
            className={`${styles.stat} ${status === s.filter && s.filter ? styles.statActive : ""}`}
            onClick={() => setStatus((cur) => (cur === s.filter ? "" : s.filter))}
          >
            <span className={styles.statIcon} style={{ color: s.color, background: s.soft }}>
              <s.icon size={22} />
            </span>
            <span className={styles.statText}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </span>
          </button>
        ))}
      </section>

      {/* Toolbar */}
      <section className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, department, or role..."
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>

        <div className={styles.desktopFilters}>{filterSelects}</div>

        <div className={styles.viewToggle}>
          <button className={view === "grid" ? styles.on : ""} onClick={() => setView("grid")} aria-label="Grid view">
            <LayoutGrid size={17} />
          </button>
          <button className={view === "list" ? styles.on : ""} onClick={() => setView("list")} aria-label="List view">
            <List size={17} />
          </button>
        </div>

        <button className={styles.filtersBtn} onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
          <SlidersHorizontal size={17} /> Filters
          {activeFilters > 0 && <em>{activeFilters}</em>}
        </button>
      </section>

      {filtersOpen && (
        <section className={styles.mobileFilters}>
          {filterSelects}
          {activeFilters > 0 && (
            <button className={styles.linkBtn} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </section>
      )}

      {/* Members */}
      <div ref={listRef} className={effectiveView === "grid" ? styles.grid : styles.list}>
        {filtered.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            view={effectiveView}
            menuOpen={menuFor === m.id}
            onMenuToggle={() => setMenuFor((cur) => (cur === m.id ? null : m.id))}
            onLeaveToggle={() => toggleLeave(m)}
            onRemove={() => askRemove(m)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p>No team members match your search.</p>
          <button className={styles.linkBtn} onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {/* Departments */}
      <section className={styles.departments}>
        <h2>Departments</h2>
        <div className={styles.deptGrid}>
          {departments.map((d) => {
            const st = DEPT_STYLE[d.name] ?? DEPT_FALLBACK;
            const Icon = st.icon;
            return (
              <button
                key={d.name}
                className={`${styles.deptTile} ${department === d.name ? styles.deptActive : ""}`}
                style={{ background: st.soft, color: st.color }}
                onClick={() => pickDepartment(d.name)}
              >
                <Icon size={20} />
                <span className={styles.deptName}>{d.name}</span>
                <strong>{d.count}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {addOpen == true && (
        <AddMemberModal
          departments={departments.map((d) => d.name)}
          designations={designations}
          onClose={closeAdd}
          onAdded={memberAdded}
          setRefreshCounter={setRefreshCounter}
          
        />
      )}

      {removedCount > 0 && (
        <p className={styles.restoreNote}>
          {removedCount} {removedCount === 1 ? "employee" : "employees"} removed (demo, until reload).{" "}
          <button className={styles.linkBtn} onClick={restoreRemoved}>
            Restore
          </button>
        </p>
      )}

      {confirmRemove && (
        <ConfirmRemoveModal
          member={confirmRemove}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={confirmRemoval}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={18} /> <span>{toast.text}</span>
          {toast.undoId && (
            <button className={styles.toastUndo} onClick={() => undoRemove(toast.undoId!)}>
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
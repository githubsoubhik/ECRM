// Dropdown options and types for the Client Onboarding Form
// Path: src/app/data/clientOnboardingData.ts

export interface Option {
  value: string;
  label: string;
}

export const businessTypes: Option[] = [
  { value: "beauty-salon", label: "Beauty Salon / Parlour" },
  { value: "makeup-artist", label: "Makeup Artist / Bridal Studio" },
  { value: "education", label: "Education / Institute" },
  { value: "fashion", label: "Fashion / Clothing Brand" },
  { value: "restaurant", label: "Restaurant / Cloud Kitchen" },
  { value: "health-fitness", label: "Health & Fitness" },
  { value: "real-estate", label: "Real Estate / Construction" },
  { value: "finance", label: "Finance / Loan Consultancy" },
  { value: "ecommerce", label: "E-commerce / D2C" },
  { value: "other", label: "Other" },
];

export const packages: Option[] = [
  { value: "basic", label: "Basic – 1 Month" },
  { value: "standard", label: "Standard – 3 Months" },
  { value: "premium", label: "Premium – 6 Months" },
  { value: "enterprise", label: "Enterprise – 12 Months" },
  { value: "custom", label: "Custom Package" },
];

export const paymentStatuses: Option[] = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partially Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

export const paymentMethods: Option[] = [
  { value: "upi", label: "UPI" },
  { value: "bank-transfer", label: "Bank Transfer (NEFT/IMPS)" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Credit / Debit Card" },
];

// Replace with data from employeeData.ts if you want a single source of truth
export const teamMembers: Option[] = [
  { value: "antora", label: "Antora" },
  { value: "ayan", label: "Ayan" },
  { value: "baban-mondal", label: "Baban Mondal" },
  { value: "bidyut-kayal", label: "Bidyut Kayal" },
  { value: "indrajit-sarkar", label: "Indrajit Sarkar" },
  { value: "sarfaraz-ali", label: "Sarfaraz Ali" },
];

export interface OnboardingFormData {
  clientName: string;
  companyName: string;
  businessType: string;
  clientLocation: string;
  facebookUserId: string;
  facebookPassword: string;
  instagramUserId: string;
  instagramPassword: string;
  gmbLink: string;
  packageDetails: string;
  startDate: string;
  endDate: string;
  totalStaticPost: string;
  totalReelPost: string;
  paymentStatus: string;
  paymentMethod: string;
  adBudget: string;
  assignedPerson: string;
  adminName: string;
  contactNumber: string;
  contactEmail: string;
}

export type FormErrors = Partial<Record<keyof OnboardingFormData | "companyLogo", string>>;

export const initialFormData: OnboardingFormData = {
  clientName: "",
  companyName: "",
  businessType: "",
  clientLocation: "",
  facebookUserId: "",
  facebookPassword: "",
  instagramUserId: "",
  instagramPassword: "",
  gmbLink: "",
  packageDetails: "",
  startDate: "",
  endDate: "",
  totalStaticPost: "",
  totalReelPost: "",
  paymentStatus: "",
  paymentMethod: "",
  adBudget: "",
  assignedPerson: "",
  adminName: "",
  contactNumber: "",
  contactEmail: "",
};

export const LOGO_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

// Shared validation — used by the page (client) and the API route (server)
export function validateOnboarding(
  data: OnboardingFormData,
  logo: { type: string; size: number } | null
): FormErrors {
  const e: FormErrors = {};
  const req = (k: keyof OnboardingFormData, msg: string) => {
    if (!data[k] || !String(data[k]).trim()) e[k] = msg;
  };

  req("clientName", "Client name is required");
  req("companyName", "Company name is required");
  req("businessType", "Select a business type");
  req("clientLocation", "Location is required");
  req("facebookUserId", "Facebook user ID is required");
  req("facebookPassword", "Facebook password is required");
  req("instagramUserId", "Instagram user ID is required");
  req("instagramPassword", "Instagram password is required");
  req("gmbLink", "GMB link is required");
  req("packageDetails", "Select a package");
  req("startDate", "Start date is required");
  req("endDate", "End date is required");
  req("totalStaticPost", "Required");
  req("totalReelPost", "Required");
  req("paymentStatus", "Select payment status");
  req("paymentMethod", "Select payment method");
  req("adBudget", "Ad budget is required");
  req("assignedPerson", "Assign a team member");
  req("adminName", "Admin name is required");
  req("contactNumber", "Contact number is required");
  req("contactEmail", "Contact email is required");

  if (data.gmbLink && !e.gmbLink) {
    try {
      const u = new URL(data.gmbLink.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      e.gmbLink = "Enter a valid URL (https://...)";
    }
  }

  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    e.endDate = "End date must be after start date";
  }

  (["totalStaticPost", "totalReelPost"] as const).forEach((k) => {
    if (data[k] && !e[k]) {
      const n = Number(data[k]);
      if (!Number.isInteger(n) || n < 0 || n > 500) e[k] = "Enter 0–500";
    }
  });

  if (data.adBudget && !e.adBudget) {
    const n = Number(data.adBudget);
    if (Number.isNaN(n) || n < 0) e.adBudget = "Enter a valid amount";
  }

  if (data.contactNumber && !e.contactNumber) {
    const digits = data.contactNumber.replace(/[\s\-+]/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) e.contactNumber = "Enter a valid 10-digit mobile number";
  }

  if (data.contactEmail && !e.contactEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.contactEmail.trim()))
      e.contactEmail = "Enter a valid email address";
  }

  if (!logo) e.companyLogo = "Upload a company logo";
  else if (!LOGO_TYPES.includes(logo.type)) e.companyLogo = "Only PNG, JPG or SVG allowed";
  else if (logo.size > LOGO_MAX_SIZE) e.companyLogo = "File must be 5 MB or smaller";

  return e;
}

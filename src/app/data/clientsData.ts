// Path: src/app/data/clientsData.ts
// Client list used by the Clients table and the Client Details page.
// Later: replace INITIAL_CLIENTS with data from your API.

export interface Client {
  id: string;
  clientName: string;
  company: string;
  industry: string | null;
  email: string;
  phone: string;
  projects: number;
  totalSpent: string;
  status: "Active" | "Inactive" | "Prospect" | string;
  joinedOn: string;
  avatar: string | null;
}

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "1",
    clientName: "PureAyus",
    company: "PureAyus",
    industry: "Skincare Brand",
    email: "contact@pureayus.com",
    phone: "+91 98765 43210",
    projects: 3,
    totalSpent: "₹1,25,000",
    status: "Active",
    joinedOn: "12 Jan 2026",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    clientName: "Zari Junction",
    company: "Zari Junction",
    industry: "Ethnic Wear",
    email: "info@zarijunction.com",
    phone: "+91 91234 56789",
    projects: 2,
    totalSpent: "₹85,000",
    status: "Active",
    joinedOn: "05 Feb 2026",
    avatar: null,
  },
  {
    id: "3",
    clientName: "Bcosmetics",
    company: "Bcosmetics",
    industry: "Beauty & Cosmetics",
    email: "hello@bcosmetics.in",
    phone: "+91 99887 66554",
    projects: 4,
    totalSpent: "₹2,10,000",
    status: "Active",
    joinedOn: "18 Feb 2026",
    avatar: null,
  },
  {
    id: "4",
    clientName: "Ranitaz Makeover",
    company: "Ranitaz Makeover",
    industry: "Bridal Makeup",
    email: "info@ranitaz.com",
    phone: "+91 90011 22334",
    projects: 1,
    totalSpent: "₹45,000",
    status: "Active",
    joinedOn: "28 Feb 2026",
    avatar: null,
  },
  {
    id: "5",
    clientName: "Ananya Verma",
    company: "Freelance Client",
    industry: null,
    email: "ananya.verma@gmail.com",
    phone: "+91 87654 32109",
    projects: 2,
    totalSpent: "₹60,000",
    status: "Active",
    joinedOn: "10 Mar 2026",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "6",
    clientName: "The Style Studio",
    company: "The Style Studio",
    industry: "Fashion Brand",
    email: "contact@thestyle.in",
    phone: "+91 78900 12345",
    projects: 3,
    totalSpent: "₹1,75,000",
    status: "Inactive",
    joinedOn: "15 Mar 2026",
    avatar: null,
  },
  {
    id: "7",
    clientName: "Karan Mehta",
    company: "Freelance Client",
    industry: null,
    email: "karan.mehta@gmail.com",
    phone: "+91 99881 77665",
    projects: 1,
    totalSpent: "₹30,000",
    status: "Active",
    joinedOn: "22 Mar 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "8",
    clientName: "Nexa Group",
    company: "Nexa Group",
    industry: "Real Estate",
    email: "hello@nexagroup.com",
    phone: "+91 91239 88776",
    projects: 2,
    totalSpent: "₹90,000",
    status: "Active",
    joinedOn: "02 Apr 2026",
    avatar: null,
  },
  {
    id: "9",
    clientName: "Sneha Kapoor",
    company: "Freelance Client",
    industry: null,
    email: "sneha.kapoor@gmail.com",
    phone: "+91 88776 55443",
    projects: 0,
    totalSpent: "₹0",
    status: "Prospect",
    joinedOn: "08 Apr 2026",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
  },
  {
    id: "10",
    clientName: "Lifestyle Decor",
    company: "Lifestyle Decor",
    industry: "Home Decor",
    email: "info@lifestyledecor.com",
    phone: "+91 77665 44332",
    projects: 1,
    totalSpent: "₹55,000",
    status: "Inactive",
    joinedOn: "12 Apr 2026",
    avatar: null,
  },
];

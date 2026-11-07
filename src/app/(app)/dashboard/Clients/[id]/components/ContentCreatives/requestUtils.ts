// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/requestUtils.ts
// Helpers for "Add New Content Request":
//  • generateCaption()          – template caption (swap for a real AI endpoint later)
//  • creativeToCalendarPost()   – turns a request into a Content Calendar post
//  • syncCreativeToCalendar()   – adds / updates that post in the calendar

import { EMPTY_PERFORMANCE, formatShort, genId, type ContentPost, type ContentType } from "../../../../../../data/contentCalendarData";
import type { Creative, CreativeType } from "../../../../../../data/contentCreativesData";
import { upsertCalendarPost } from "../ContentCalendar/calendarStore";

/* ── Caption generator ──────────────────────────────────────
   To use a real AI service, replace the body of generateCaption()
   with a fetch to your endpoint and return the text.            */

interface CaptionInput {
  title: string;
  purpose: string;
  tone: string;
  language: string;
  clientName: string;
  type: CreativeType;
  round: number; // click count – gives a different version every time
}

const OPENERS: Record<string, string[]> = {
  "Elegant & Royal": ["A timeless look for your special day! ✨", "Grace, glow and elegance – all in one look 👑", "Because every bride deserves to feel like royalty 💫"],
  "Fun & Playful": ["Glam mode: ON! 💃", "Who's ready to slay today? 😍", "A little sparkle never hurt anyone ✨"],
  "Minimal & Clean": ["Simple. Fresh. Beautiful.", "Less is more – and it shows.", "Clean beauty, done right."],
  "Bold & Vibrant": ["Make heads turn! 🔥", "Bold colours. Bolder you. 💥", "Go big or go home 💄"],
  "Warm & Emotional": ["Some moments deserve to look perfect 💖", "Made with love, for your happiest day 🌸", "Your smile is our favourite result 😊"],
  Professional: ["Expert results you can trust.", "Professional finish, every single time.", "Quality that speaks for itself."],
};

const PURPOSE_LINE: Record<string, string> = {
  "Brand Awareness": "Get to know the artistry behind every look.",
  Engagement: "Tell us in the comments – which look is your favourite? 👇",
  "Lead Generation": "Limited slots available – enquire now!",
  "Sales / Bookings": "Bookings are open now – don't miss your date!",
  "Offer / Promotion": "Special offer for a limited time only! 🎁",
  "Education / Tips": "Save this post for your next look 📌",
  Announcement: "Big news – stay tuned for more! 📣",
  "Festive Greeting": "Wishing you joy, light and endless celebrations 🪔",
};

const TYPE_LINE: Record<CreativeType, string> = {
  Image: "",
  Video: "Watch till the end! 🎬",
  Carousel: "Swipe ➡️ to see more.",
  Story: "Tap to know more 👆",
  Collection: "",
  Other: "",
};

const CTA: Record<string, (c: string) => string> = {
  English: (c) => `Book your slot with ${c} today!`,
  Bengali: (c) => `আজই বুক করুন ${c}-এর সাথে! ✨`,
  Hindi: (c) => `आज ही ${c} के साथ अपना स्लॉट बुक करें! ✨`,
  Hinglish: (c) => `Aaj hi ${c} ke saath apna slot book karo! ✨`,
  Benglish: (c) => `Aajkei ${c}-er sathe apnar slot book korun! ✨`,
};

const tagify = (s: string) => `#${s.replace(/[^a-z0-9]/gi, "")}`;

export function generateCaption({ title, purpose, tone, language, clientName, type, round }: CaptionInput, max = 500) {
  const openers = OPENERS[tone] ?? OPENERS["Elegant & Royal"];
  const client = clientName || "us";
  const lines = [
    openers[round % openers.length],
    `${CTA[language]?.(client) ?? CTA.English(client)}`,
    [PURPOSE_LINE[purpose], TYPE_LINE[type]].filter(Boolean).join(" "),
  ].filter(Boolean);

  const words = title
    .split(/[\s\-–,]+/)
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .map(tagify);
  const hashtags = [...words, "#KolkataMakeup", "#MakeupArtist", tagify(client), "#BridalBeauty"]
    .filter((t, i, a) => t.length > 1 && a.indexOf(t) === i)
    .slice(0, 6)
    .join(" ");

  return `${lines.join("\n")}\n\n${hashtags}`.slice(0, max);
}

/* ── Content Creatives → Content Calendar ───────────────── */

const TYPE_TO_CALENDAR: Record<CreativeType, ContentType> = {
  Image: "Image",
  Video: "Reel",
  Carousel: "Carousel",
  Story: "Story",
  Collection: "Collection",
  Other: "Other",
};

export function creativeToCalendarPost(c: Creative, postId: string): ContentPost {
  const media = (c.brief?.references.length ? c.brief.references : c.media).filter((m) => m.kind !== "file");
  return {
    id: postId,
    title: c.title,
    type: TYPE_TO_CALENDAR[c.type],
    platforms: c.platforms,
    date: c.date,
    time: c.time,
    status: c.status,
    caption: c.caption,
    media,
    tags: c.tags,
    performance: { ...EMPTY_PERFORMANCE },
    comments: [],
    history: [
      {
        id: `${postId}-h1`,
        action: `Created from content request${c.brief?.assignee ? ` · assigned to ${c.brief.assignee}` : ""}`,
        by: c.createdBy,
        time: c.date ? formatShort(c.date) : "",
      },
    ],
    createdBy: c.createdBy,
  };
}

/** Adds the creative to the calendar (or updates it) and returns the creative with the post id saved */
export function syncCreativeToCalendar(clientId: string, c: Creative): Creative {
  if (!c.brief) return c;
  const postId = c.brief.calendarPostId ?? genId("post");
  upsertCalendarPost(clientId, creativeToCalendarPost(c, postId));
  return { ...c, brief: { ...c.brief, calendarPostId: postId } };
}

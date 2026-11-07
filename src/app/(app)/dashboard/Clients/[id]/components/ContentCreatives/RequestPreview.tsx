"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/RequestPreview.tsx
// "Content Preview (Reference)" – live mock of the post while the form is filled in.

import { useState, type CSSProperties } from "react";
import { Bookmark, Globe, Heart, MessageCircle, MoreHorizontal, Send, Share2, ThumbsUp } from "lucide-react";
import rq from "./CreativeModal.module.css";
import type { CreativeMedia, CreativeType } from "../../../../../../data/contentCreativesData";
import { PlatformIcon, cx } from "../ContentCalendar/ccUi";
import { CreativeThumb } from "./CreativeCard";

type View = "instagram" | "facebook" | "story";

interface Props {
  title: string;
  caption: string;
  purpose: string;
  colors: string[];
  references: CreativeMedia[];
  clientName: string;
  clientLogo: string | null;
  type: CreativeType;
}

const CTA: Record<string, string> = {
  "Sales / Bookings": "Book Now",
  "Lead Generation": "Enquire Now",
  "Offer / Promotion": "Grab the Offer",
  "Education / Tips": "Save for Later",
  Engagement: "Comment Below",
  Announcement: "Learn More",
  "Brand Awareness": "Book Now",
};

const handle = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbrand";

function Avatar({ name, logo }: { name: string; logo: string | null }) {
  return <span className={rq.pvAvatar}>{logo ? <CreativeThumb src={logo} alt="" className={rq.pvAvatarImg} /> : name.charAt(0)}</span>;
}

/** The designed artwork: reference image (if any) + title / CTA in the chosen colours */
function Artwork({ title, purpose, colors, image, clientName, overlay, variant }: { title: string; purpose: string; colors: string[]; image?: string; clientName: string; overlay: boolean; variant: View }) {
  const [c1 = "#a3171d", c2 = "#c9973a", c3 = "#f3e2c4"] = colors;
  const style = { "--pv1": c1, "--pv2": c2, "--pv3": c3 } as CSSProperties;
  const cta = CTA[purpose];
  return (
    <div className={cx(rq.art, variant === "story" && rq.artStory, variant === "facebook" && rq.artFb, !image && rq.artEmpty)} style={style}>
      {image && <CreativeThumb src={image} alt="Reference" className={rq.artImg} />}
      {overlay && (
        <div className={rq.artText}>
          <h4>{title.trim() || "Your content title"}</h4>
          <p>{clientName}</p>
          {cta && <span className={rq.artCta}>{cta}</span>}
        </div>
      )}
    </div>
  );
}

export default function RequestPreview({ title, caption, purpose, colors, references, clientName, clientLogo, type }: Props) {
  const [view, setView] = useState<View>(type === "Story" ? "story" : "instagram");
  const [overlay, setOverlay] = useState(true);
  const [index, setIndex] = useState(0);

  const images = references.filter((r) => r.kind === "image");
  const idx = Math.min(index, Math.max(0, images.length - 1));
  const current = images[idx]?.url;
  const user = handle(clientName);
  const text = caption.trim() || "Your caption will appear here…";

  const art = <Artwork title={title} purpose={purpose} colors={colors} image={current} clientName={clientName} overlay={overlay} variant={view} />;

  return (
    <div className={rq.preview}>
      <div className={rq.pvTabs} role="tablist" aria-label="Preview type">
        <button type="button" role="tab" aria-selected={view === "instagram"} className={cx(rq.pvTab, view === "instagram" && rq.pvTabOn)} onClick={() => setView("instagram")}>
          <PlatformIcon platform="Instagram" size={15} /> Instagram Post
        </button>
        <button type="button" role="tab" aria-selected={view === "facebook"} className={cx(rq.pvTab, view === "facebook" && rq.pvTabOn)} onClick={() => setView("facebook")}>
          <PlatformIcon platform="Facebook" size={15} /> Facebook Post
        </button>
        <button type="button" role="tab" aria-selected={view === "story"} className={cx(rq.pvTab, view === "story" && rq.pvTabOn)} onClick={() => setView("story")}>
          <span className={rq.storyRing} /> Story Preview
        </button>
      </div>

      <div className={rq.pvStage}>
        {view === "instagram" && (
          <div className={rq.pvCard}>
            <div className={rq.pvHead}>
              <Avatar name={clientName} logo={clientLogo} />
              <strong>{user}</strong>
              <MoreHorizontal className={rq.pvMore} />
            </div>
            {art}
            <div className={rq.pvActions}>
              <Heart /> <MessageCircle /> <Send />
              {images.length > 1 && (
                <span className={rq.pvDots}>
                  {images.map((_, i) => (
                    <i key={i} className={i === idx ? rq.pvDotOn : ""} />
                  ))}
                </span>
              )}
              <Bookmark className={rq.pvSave} />
            </div>
            <p className={rq.pvCaption}>
              <strong>{user}</strong> {text}
            </p>
          </div>
        )}

        {view === "facebook" && (
          <div className={rq.pvCard}>
            <div className={rq.pvHead}>
              <Avatar name={clientName} logo={clientLogo} />
              <span className={rq.pvFbName}>
                <strong>{clientName}</strong>
                <small>
                  Just now · <Globe />
                </small>
              </span>
              <MoreHorizontal className={rq.pvMore} />
            </div>
            <p className={cx(rq.pvCaption, rq.pvFbText)}>{text}</p>
            {art}
            <div className={rq.pvFbBar}>
              <span><ThumbsUp /> Like</span>
              <span><MessageCircle /> Comment</span>
              <span><Share2 /> Share</span>
            </div>
          </div>
        )}

        {view === "story" && (
          <div className={rq.pvStory}>
            {art}
            <div className={rq.pvStoryTop}>
              <span className={rq.pvBars}>
                {(images.length ? images : [null]).map((_, i) => (
                  <i key={i} className={i <= idx ? rq.pvBarOn : ""} />
                ))}
              </span>
              <span className={rq.pvStoryUser}>
                <Avatar name={clientName} logo={clientLogo} />
                <strong>{user}</strong>
                <small>1m</small>
              </span>
            </div>
            <div className={rq.pvStoryBottom}>
              <span>Send message</span>
              <Heart />
              <Send />
            </div>
          </div>
        )}
      </div>

      <div className={rq.pvFoot}>
        {images.length > 1 ? (
          <div className={rq.pvThumbs}>
            {images.map((m, i) => (
              <button key={`${m.url}-${i}`} type="button" className={cx(rq.pvThumb, i === idx && rq.pvThumbOn)} onClick={() => setIndex(i)} aria-label={`Preview reference ${i + 1}`}>
                <CreativeThumb src={m.url} alt="" className={rq.refMedia} />
              </button>
            ))}
          </div>
        ) : (
          <span className={rq.pvHint}>{images.length ? "Using your reference image" : "Upload a reference image to see it here"}</span>
        )}
        <label className={rq.pvOverlay}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          Text on design
        </label>
      </div>
    </div>
  );
}

// Path: src/app/dashboard/ClientOnboardingForm/components/BrandIcons.tsx
// Lightweight inline icons (newer lucide-react versions no longer ship brand icons)

export function FacebookIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#1877F2" />
      <path
        d="M21.5 32V20.6h3.8l.6-4.4h-4.4v-2.8c0-1.3.4-2.1 2.2-2.1H26V7.4a31 31 0 0 0-3.4-.2c-3.4 0-5.7 2.1-5.7 5.9v3.1H13v4.4h3.9V32h4.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <radialGradient id="igGrad" cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#FDF497" />
          <stop offset="0.05" stopColor="#FDF497" />
          <stop offset="0.45" stopColor="#FD5949" />
          <stop offset="0.6" stopColor="#D6249F" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#igGrad)" />
      <rect x="8" y="8" width="16" height="16" rx="4.6" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="3.9" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="20.9" cy="11.1" r="1.2" fill="#fff" />
    </svg>
  );
}

export function GmbIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#3B6FE0" />
      <path d="M7 12.5 9 8h14l2 4.5v1a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 16 15a2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 7 13.5v-1Z" fill="#fff" />
      <path d="M9 16.5V24h14v-7.5" fill="none" stroke="#fff" strokeWidth="2" />
      <rect x="14" y="19" width="4" height="5" fill="#fff" />
    </svg>
  );
}

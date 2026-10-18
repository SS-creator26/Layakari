const paths = {
  discover: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="3.5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  library: <path d="M5 4v16M9 4v16M14 5l4 15" />,
  academy: (
    <>
      <path d="M3 9l9-5 9 5-9 5z" />
      <path d="M7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5" />
    </>
  ),
  studio: <path d="M4 19V9M9 19V5M14 19v-8M19 19V7" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  signout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5M5 12h11" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths | "play" | "pause";

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  if (name === "play" || name === "pause") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...a11y}>
        {name === "play" ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...a11y}>
      {paths[name]}
    </svg>
  );
}

export function LogoMark({ size = 30, ring = "var(--beat)" }: { size?: number; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="17" r="9" fill="none" stroke={ring} strokeWidth="2.4" />
      <circle cx="16" cy="8" r="3" fill={ring} />
    </svg>
  );
}

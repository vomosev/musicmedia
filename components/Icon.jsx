const iconPaths = {
  "arrow-left": <path d="m15 18-6-6 6-6M9 12h10" />,
  "arrow-right": <path d="m9 18 6-6-6-6M5 12h10" />,
  "book-open": (
    <>
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22V4.5Z" />
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5A2.5 2.5 0 0 1 22 22V4.5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  campaigns: (
    <>
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 15.4 13 21H8l-1.7-6.8" />
    </>
  ),
  "chart-bar": (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  disc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v6.5M21 12h-6.5" />
    </>
  ),
  "dollar-sign": (
    <>
      <path d="M12 2v20" />
      <path d="M17 6.5c-1-1-2.4-1.5-4.2-1.5C10.1 5 8 6.4 8 8.5S9.8 12 12.5 12 17 13.4 17 15.5 14.9 19 12.2 19C10.4 19 9 18.5 8 17.5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20H4a1 1 0 0 1-1-1v-4.6a2 2 0 0 1 .6-1.4L15.5 1.1a1.5 1.5 0 0 1 2.1 0l2.3 2.3a1.5 1.5 0 0 1 0 2.1L8 17.4" />
      <path d="m14 3 7 7" />
    </>
  ),
  "external-link": (
    <>
      <path d="M14 3h7v7M21 3l-9 9" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14a2 2 0 0 1 2-2h2v8H6a2 2 0 0 1-2-2v-4ZM20 14a2 2 0 0 0-2-2h-2v8h2a2 2 0 0 0 2-2v-4Z" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  login: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </>
  ),
  logout: (
    <>
      <path d="m14 17 5-5-5-5M19 12H8" />
      <path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  marketing: (
    <>
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 15.4 13 21H8l-1.7-6.8M21 10h1M20 4l1.5-1.5M20 20l1.5 1.5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
      <path d="m9 9 11-2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  publishing: (
    <>
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22V4.5Z" />
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5A2.5 2.5 0 0 1 22 22V4.5Z" />
    </>
  ),
  releases: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v6.5M21 12h-6.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5.2 3.3 9.2 8 11 4.7-1.8 8-5.8 8-11V5l-8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V3h8v3M19 6l-1 15H6L5 6M10 10v7M14 10v7" />
    </>
  ),
  "trending-up": (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M16 4.5a4 4 0 0 1 0 7.5M18 14a7 7 0 0 1 4 7" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />
};

export function Icon({ name, label, className = "" }) {
  const paths = iconPaths[name];

  if (!paths) {
    return null;
  }

  const accessibleLabel =
    typeof label === "string" && label.trim() ? label.trim() : null;
  const classes = ["icon", className].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths}
    </svg>
  );
}

export default Icon;
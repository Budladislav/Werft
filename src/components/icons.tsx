import type { SVGProps } from "react";

export type IconName =
  | "overview"
  | "dock"
  | "projects"
  | "journal"
  | "maintenance"
  | "ideas"
  | "settings"
  | "menu"
  | "close"
  | "github"
  | "sync"
  | "clock"
  | "chevron"
  | "arrow"
  | "shield"
  | "database"
  | "check"
  | "alert"
  | "search"
  | "download"
  | "filter"
  | "plus"
  | "note"
  | "branch"
  | "code"
  | "backup"
  | "monitor"
  | "mobile"
  | "calendar"
  | "external"
  | "spark"
  | "copy";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function Icon({ name, ...props }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    overview: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/></>,
    dock: <><path d="M4 4v16M20 4v16M4 8h16M4 16h16"/><path d="m9 12 3-2 3 2-3 2-3-2Z"/></>,
    projects: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 5V3h8v2M3 10h18"/></>,
    journal: <><path d="M6 3h12v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M7 8h7M7 12h8M7 16h5"/></>,
    maintenance: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5.2 5.2l-6.9 6.9a2.1 2.1 0 1 0 3 3l6.9-6.9a4 4 0 0 1 5.2-5.2l-3 3-3-3Z"/></>,
    ideas: <><path d="M9 18h6M10 22h4"/><path d="M8.2 14.5A7 7 0 1 1 15.8 14.5C14.7 15.3 14 16.1 14 18h-4c0-1.9-.7-2.7-1.8-3.5Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.5a13.4 13.4 0 0 0-6 0C6.1-.4 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 3.2 7.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4"/><path d="M9 19c-3 .9-3-1.5-4.2-2"/></>,
    sync: <><path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-13.7-2.7L4 7M4 17h5v5"/><path d="M4 17a8 8 0 0 0 13.7 2.7L20 17"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    shield: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M10.3 3.6 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    note: <><path d="M5 3h11l3 3v15H5Z"/><path d="M15 3v4h4M8 12h8M8 16h6"/></>,
    branch: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10M8 9c5 0 4-2 8-2"/></>,
    code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>,
    backup: <><path d="M4 7v13h16V7M2 7h20l-2-4H4L2 7Z"/><path d="M9 12h6"/></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    mobile: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
    spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function WerftMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M7 12h34M10 20h28M13 28h22" stroke="currentColor" strokeWidth="2" opacity=".42"/>
      <path d="M13 7v26c0 5 4.9 8 11 8s11-3 11-8V7" stroke="currentColor" strokeWidth="2.5"/>
      <path d="m18 25 6-4 6 4-6 4-6-4Z" fill="currentColor"/>
      <path d="M6 36c5-2 8 2 13 0s8 2 13 0 7 1 10 0" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

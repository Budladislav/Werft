"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName, WerftMark } from "./icons";

type NavItem = { href: string; label: string; shortLabel?: string; icon: IconName };

const primary: NavItem[] = [
  { href: "/overview", label: "Обзор", icon: "overview" },
  { href: "/dock", label: "Док", icon: "dock" },
  { href: "/projects", label: "Проекты", icon: "projects" },
  { href: "/journal", label: "Журнал", icon: "journal" },
];

const operations: NavItem[] = [
  { href: "/maintenance", label: "Обслуживание", shortLabel: "Сервис", icon: "maintenance" },
  { href: "/ideas", label: "Идеи", icon: "ideas" },
];

const system: NavItem[] = [{ href: "/settings", label: "Настройки", icon: "settings" }];
const allItems = [...primary, ...operations, ...system];

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
}

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const active = isActive(pathname, item.href);
  return (
    <Link className={`nav-link${active ? " is-active" : ""}`} href={item.href} onClick={onClick}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {active && <span className="nav-rivet" />}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/start") return children;

  const menuActive = menuOpen || [...operations, ...system].some(item => isActive(pathname, item.href));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/overview" className="brand-lockup" aria-label="Верфь — обзор">
          <WerftMark className="brand-mark" />
          <span><strong>Верфь</strong><small>project operations</small></span>
        </Link>

        <div className="sidebar-rule"><span>01</span></div>
        <nav aria-label="Основная навигация">
          {primary.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
        </nav>

        <p className="nav-caption">Эксплуатация</p>
        <nav aria-label="Эксплуатация">
          {operations.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
        </nav>

        <div className="sidebar-spacer" />
        <nav aria-label="Система">
          {system.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
        </nav>
        <div className="sidebar-status">
          <span className="signal is-good" />
          <span><strong>Локальный контур</strong><small>данные на этом устройстве</small></span>
        </div>
      </aside>

      <div className="workspace">
        <main className="page-frame">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Быстрая навигация">
        {primary.map(item => (
          <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "is-active" : ""}>
            <Icon name={item.icon} /><span>{item.shortLabel ?? item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={menuActive ? "is-active" : ""}
          aria-label="Открыть меню"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-sheet"
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" /><span>Меню</span>
        </button>
      </nav>

      {menuOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside id="mobile-navigation-sheet" className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Навигация" onClick={event => event.stopPropagation()}>
            <div className="sheet-head">
              <div><p className="eyebrow">Навигация</p><h2>Куда направляемся?</h2></div>
              <button className="icon-button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}><Icon name="close" /></button>
            </div>
            <nav>
              {allItems.map(item => <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setMenuOpen(false)} />)}
            </nav>
            <div className="sidebar-status light">
              <span className="signal is-good" />
              <span><strong>Локальный контур активен</strong><small>синхронизация GitHub — только чтение</small></span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

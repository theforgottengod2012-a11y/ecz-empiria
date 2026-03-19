import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Terminal, MessageSquare, BookOpen,
  Shield, Moon, Sun, Monitor, Zap, ExternalLink,
  FileText, Lock
} from "lucide-react";
import { useTheme } from "./theme-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/control", label: "Bot Control", icon: Terminal },
  { href: "/dms", label: "DM Manager", icon: MessageSquare },
  { href: "/commands", label: "Commands", icon: BookOpen },
];

const legalItems = [
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Lock },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isActive: boolean;
}

function NavItem({ href, label, icon: Icon, badge, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative group ${
        isActive
          ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
      data-testid={`link-nav-${label.toLowerCase().replace(/ /g, "-")}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {badge && (
        <span className="text-[9px] font-bold bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sidebar-foreground text-sm tracking-wide leading-none">EMPIRIA</div>
            <div className="text-[11px] text-sidebar-foreground/50 mt-0.5">Bot Dashboard v2</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-5">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Management</p>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              badge={item.label === "DM Manager" ? "NEW" : undefined}
              isActive={location === item.href}
            />
          ))}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Legal</p>
          {legalItems.map((item) => (
            <NavItem key={item.href} {...item} isActive={location === item.href} />
          ))}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">Links</p>
          <a
            href="https://discord.gg/ecz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Support Server</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={cycleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
          data-testid="button-theme-toggle"
        >
          <ThemeIcon className="w-4 h-4 flex-shrink-0" />
          <span>{themeLabel} Mode</span>
        </button>
        <div className="flex items-center gap-2 px-3">
          <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-[10px] text-sidebar-foreground/40 truncate">Empiria v2.0 • Top-Tier Bot</span>
        </div>
      </div>
    </div>
  );
}

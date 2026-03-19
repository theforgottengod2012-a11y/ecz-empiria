import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, BookOpen, Coins, Shield, Zap, Leaf, Star,
  Sword, Music, Ticket, Wrench, Trophy, Lock, CheckSquare,
  MessageSquare, Plus, Bot
} from "lucide-react";
import { useState } from "react";

interface CommandData {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  permissions?: string[];
  module: string;
}

interface CommandsResponse {
  categories: Record<string, CommandData[]>;
  total: number;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  economy:     { icon: Coins,   color: "text-yellow-400", bg: "bg-yellow-500/15", label: "Economy" },
  moderation:  { icon: Shield,  color: "text-red-400",    bg: "bg-red-500/15",    label: "Moderation" },
  fun:         { icon: Zap,     color: "text-pink-400",   bg: "bg-pink-500/15",   label: "Fun & Games" },
  farming:     { icon: Leaf,    color: "text-green-400",  bg: "bg-green-500/15",  label: "Farming" },
  pets:        { icon: Star,    color: "text-purple-400", bg: "bg-purple-500/15", label: "Pets" },
  government:  { icon: Sword,   color: "text-blue-400",   bg: "bg-blue-500/15",   label: "Government" },
  music:       { icon: Music,   color: "text-cyan-400",   bg: "bg-cyan-500/15",   label: "Music" },
  tickets:     { icon: Ticket,  color: "text-orange-400", bg: "bg-orange-500/15", label: "Tickets" },
  utility:     { icon: Wrench,  color: "text-gray-400",   bg: "bg-gray-500/15",   label: "Utility" },
  clans:       { icon: Trophy,  color: "text-amber-400",  bg: "bg-amber-500/15",  label: "Clans" },
  antinuke:    { icon: Lock,    color: "text-red-300",    bg: "bg-red-500/10",    label: "Anti-Nuke" },
  stardust:    { icon: Star,    color: "text-indigo-400", bg: "bg-indigo-500/15", label: "Stardust" },
  giveaway:    { icon: Trophy,  color: "text-lime-400",   bg: "bg-lime-500/15",   label: "Giveaways" },
  verify:      { icon: CheckSquare, color: "text-teal-400", bg: "bg-teal-500/15", label: "Verification" },
  extra:       { icon: Plus,    color: "text-slate-400",  bg: "bg-slate-500/15",  label: "Extra" },
  system:      { icon: Bot,     color: "text-violet-400", bg: "bg-violet-500/15", label: "System" },
};

const FALLBACK_META = { icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted", label: "Other" };

function CommandCard({ cmd }: { cmd: CommandData }) {
  return (
    <div className="p-3 rounded-md border border-border/50 hover-elevate bg-card" data-testid={`card-command-${cmd.name}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-mono font-bold text-primary">${cmd.name}</code>
          {cmd.aliases && cmd.aliases.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {cmd.aliases.map(a => (
                <code key={a} className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">${a}</code>
              ))}
            </div>
          )}
        </div>
        {cmd.permissions && cmd.permissions.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">{cmd.permissions[0]}</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{cmd.description}</p>
      {cmd.usage && (
        <code className="text-[10px] text-muted-foreground/60 mt-1.5 block">Usage: {cmd.usage}</code>
      )}
    </div>
  );
}

export default function CommandsBrowser() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading } = useQuery<CommandsResponse>({
    queryKey: ["/api/bot/commands"],
  });

  const categories = data?.categories || {};
  const allCommands = Object.values(categories).flat();

  const filtered = search
    ? allCommands.filter(c =>
        c.name.includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        (c.aliases || []).some(a => a.includes(search.toLowerCase()))
      )
    : activeTab === "all"
      ? allCommands
      : (categories[activeTab] || []);

  const categoryKeys = Object.keys(categories);

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-slide-in-up">

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Commands Browser</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data?.total ? `${data.total} commands across ${categoryKeys.length} categories` : "Browse all bot commands"}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search commands..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-commands"
            />
          </div>
        </div>

        {/* Category stats */}
        {!search && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categoryKeys.slice(0, 10).map(key => {
              const meta = CATEGORY_META[key] || FALLBACK_META;
              const count = categories[key]?.length || 0;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); }}
                  className={`p-3 rounded-md border text-left hover-elevate transition-all ${activeTab === key ? "border-primary/50 bg-primary/10" : "border-border/50 bg-card"}`}
                  data-testid={`button-category-${key}`}
                >
                  <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center mb-2`}>
                    <meta.icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} commands</p>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">{search ? "No commands match your search" : "No commands loaded"}</p>
            <p className="text-sm opacity-60 mt-1">{search ? "Try a different search term" : "Start the bot to load commands"}</p>
          </div>
        ) : (
          <>
            {!search && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover-elevate"}`}
                  data-testid="button-tab-all"
                >
                  All ({allCommands.length})
                </button>
                {categoryKeys.map(key => {
                  const meta = CATEGORY_META[key] || FALLBACK_META;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover-elevate"}`}
                      data-testid={`button-tab-${key}`}
                    >
                      {meta.label} ({categories[key]?.length || 0})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="container-commands">
              {filtered.map((cmd, i) => <CommandCard key={`${cmd.module}-${cmd.name}-${i}`} cmd={cmd} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

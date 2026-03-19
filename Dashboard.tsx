import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Server, Users, Terminal, Wifi, Clock, Play, Square, RotateCcw,
  TrendingUp, Shield, Coins, Leaf, Sword, Star, Zap, MessageSquare,
  CheckCircle2, AlertCircle, Loader2, Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface BotStatus {
  status: "running" | "stopped" | "starting" | "stopping" | "error";
  stats: {
    guilds: number;
    users: number;
    commands: number;
    ping: number;
    uptime: number;
    tag: string | null;
  };
  logs: Array<{ t: number; text: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    running: { label: "Online", className: "bg-green-500/15 text-green-400 border-green-500/30" },
    stopped: { label: "Offline", className: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    starting: { label: "Starting...", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    stopping: { label: "Stopping...", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    error: { label: "Error", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const config = configs[status as keyof typeof configs] || configs.stopped;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "running" ? "bg-green-400 animate-pulse-dot" : status === "starting" ? "bg-yellow-400 animate-pulse-dot" : "bg-current"}`} />
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <Card className="border-card-border hover-elevate cursor-default" data-testid={`card-stat-${label.toLowerCase().replace(/ /g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function fmtUptime(seconds: number) {
  if (!seconds) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(seconds % 60)}s`;
}

const FEATURES = [
  { icon: Coins, label: "Economy", desc: "Full economy with jobs, gambling, shops, heists, leaderboards & prestige system", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: Shield, label: "Government", desc: "Laws, taxes, budgets, treasury management & government benefits system", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Zap, label: "Fun & Games", desc: "Trivia, 8-ball, blackjack, connect4, wordle, chess, hangman & 20+ more games", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: Leaf, label: "Farming", desc: "Plant seeds, water crops, harvest, use fertilizer & sell at market for profit", color: "text-green-400", bg: "bg-green-500/10" },
  { icon: Star, label: "Pets", desc: "Catch, train, evolve & battle pets. Pet tournaments & XP-based leveling system", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: Sword, label: "Moderation", desc: "AutoMod, mod tracker, case logs, anti-nuke, tickets, jails & full role management", color: "text-red-400", bg: "bg-red-500/10" },
  { icon: Activity, label: "Mod Tracker (MT)", desc: "Live mod activity board, daily message tracking, online hours, auto-demotion system", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: MessageSquare, label: "DM Manager", desc: "View all DMs sent to the bot, reply as the bot, full DM thread management", color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000,
  });

  const controlMutation = useMutation({
    mutationFn: (action: "start" | "stop" | "restart") =>
      apiRequest("POST", `/api/bot/${action}`),
    onSuccess: (_, action) => {
      toast({ title: action === "start" ? "Bot starting..." : action === "stop" ? "Bot stopping..." : "Bot restarting...", description: "Status will update shortly." });
      setTimeout(() => qc.invalidateQueries({ queryKey: ["/api/bot/status"] }), 2000);
    },
    onError: () => toast({ title: "Action failed", description: "Could not control the bot. Check your environment.", variant: "destructive" }),
  });

  const status = data?.status || "stopped";
  const stats = data?.stats || { guilds: 0, users: 0, commands: 0, ping: 0, uptime: 0, tag: null };
  const logs = data?.logs || [];

  const isRunning = status === "running";
  const isPending = controlMutation.isPending;

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-slide-in-up">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.tag ? `Connected as ${stats.tag}` : "Empiria Bot Management Center"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={() => controlMutation.mutate(isRunning ? "stop" : "start")}
              disabled={isPending || status === "starting" || status === "stopping"}
              data-testid={`button-bot-${isRunning ? "stop" : "start"}`}
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : isRunning ? <Square className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
              {isPending ? "Working..." : isRunning ? "Stop Bot" : "Start Bot"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => controlMutation.mutate("restart")}
              disabled={isPending || !isRunning}
              data-testid="button-bot-restart"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Restart
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Server} label="Servers" value={isLoading ? "—" : stats.guilds.toLocaleString()} color="bg-primary/15 text-primary" />
          <StatCard icon={Users} label="Members" value={isLoading ? "—" : stats.users.toLocaleString()} color="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Terminal} label="Commands" value={isLoading ? "—" : stats.commands.toLocaleString()} color="bg-purple-500/15 text-purple-400" />
          <StatCard icon={Wifi} label="Ping" value={isLoading ? "—" : `${stats.ping}ms`} color="bg-green-500/15 text-green-400" sub={stats.ping < 100 ? "Excellent" : stats.ping < 200 ? "Good" : "Slow"} />
          <StatCard icon={Clock} label="Uptime" value={isLoading ? "—" : fmtUptime(stats.uptime)} color="bg-yellow-500/15 text-yellow-400" />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Logs */}
          <div className="lg:col-span-2">
            <Card className="border-card-border h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    Recent Logs
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs" data-testid="badge-log-count">{logs.length} entries</Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <div className="h-64 overflow-auto scrollbar-thin font-mono text-xs p-4 space-y-1" data-testid="container-logs">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {isLoading ? "Loading..." : "No logs yet. Start the bot to see activity."}
                    </div>
                  ) : (
                    [...logs].reverse().map((log, i) => (
                      <div key={i} className={`flex items-start gap-2 ${log.text.includes("[ERR]") || log.text.includes("❌") ? "text-red-400" : log.text.includes("✅") || log.text.includes("🟢") ? "text-green-400" : log.text.includes("⚠️") ? "text-yellow-400" : "text-muted-foreground"}`} data-testid={`log-entry-${i}`}>
                        <span className="text-muted-foreground/40 shrink-0">{new Date(log.t).toLocaleTimeString("en-US", { hour12: false })}</span>
                        <span className="break-all">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  System Status
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {[
                  { label: "Bot Process", ok: isRunning },
                  { label: "Database", ok: isRunning },
                  { label: "Mod Tracker", ok: isRunning },
                  { label: "Economy Engine", ok: isRunning },
                  { label: "Auto-Mod", ok: isRunning },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm" data-testid={`status-item-${item.label.toLowerCase().replace(/ /g, "-")}`}>
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.ok
                      ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Operational</span>
                      : <span className="flex items-center gap-1 text-gray-400 text-xs"><AlertCircle className="w-3.5 h-3.5" />Offline</span>
                    }
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href="/control" data-testid="link-quick-control">View Full Logs</a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href="/dms" data-testid="link-quick-dms">Manage DMs</a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                    <a href="/commands" data-testid="link-quick-commands">Browse Commands</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Bot Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.label} className="border-card-border hover-elevate cursor-default" data-testid={`card-feature-${f.label.toLowerCase().replace(/ /g, "-")}`}>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">{f.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

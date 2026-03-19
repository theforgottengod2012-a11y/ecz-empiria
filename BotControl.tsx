import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Play, Square, RotateCcw, Terminal, Loader2, Download,
  Search, X, CheckCircle2, XCircle, AlertCircle, Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";

interface BotStatus {
  status: "running" | "stopped" | "starting" | "stopping" | "error";
  stats: { guilds: number; users: number; commands: number; ping: number; uptime: number; tag: string | null };
  logs: Array<{ t: number; text: string }>;
}

function getLogColor(text: string) {
  if (text.includes("[ERR]") || text.includes("❌") || text.includes("error") || text.includes("Error")) return "text-red-400";
  if (text.includes("✅") || text.includes("🟢") || text.includes("success") || text.includes("started")) return "text-green-400";
  if (text.includes("⚠️") || text.includes("warn") || text.includes("WARN")) return "text-yellow-400";
  if (text.includes("🤖") || text.includes("online") || text.includes("ready")) return "text-primary";
  if (text.includes("🌐") || text.includes("database") || text.includes("Database")) return "text-cyan-400";
  return "text-muted-foreground";
}

function fmtUptime(seconds: number) {
  if (!seconds) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function BotControl() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.logs, autoScroll]);

  const controlMutation = useMutation({
    mutationFn: (action: "start" | "stop" | "restart") => apiRequest("POST", `/api/bot/${action}`),
    onSuccess: (_, action) => {
      const msgs = { start: "Bot is starting up...", stop: "Bot is stopping...", restart: "Bot is restarting..." };
      toast({ title: msgs[action] });
      setTimeout(() => qc.invalidateQueries({ queryKey: ["/api/bot/status"] }), 2000);
    },
    onError: () => toast({ title: "Command failed", description: "Cannot control bot — check environment secrets.", variant: "destructive" }),
  });

  const status = data?.status || "stopped";
  const stats = data?.stats || { guilds: 0, users: 0, commands: 0, ping: 0, uptime: 0, tag: null };
  const allLogs = data?.logs || [];
  const filteredLogs = filter ? allLogs.filter(l => l.text.toLowerCase().includes(filter.toLowerCase())) : allLogs;
  const isRunning = status === "running";
  const isPending = controlMutation.isPending;

  const downloadLogs = () => {
    const text = allLogs.map(l => `[${new Date(l.t).toISOString()}] ${l.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `empiria-logs-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const StatusIcon = isRunning ? CheckCircle2 : status === "error" ? XCircle : status === "starting" || status === "stopping" ? Clock : AlertCircle;
  const statusColors = {
    running: "text-green-400", stopped: "text-gray-400", error: "text-red-400",
    starting: "text-yellow-400", stopping: "text-orange-400"
  };

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-slide-in-up">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Bot Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage the bot process and view live logs</p>
        </div>

        {/* Control Panel */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-card-border sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <StatusIcon className={`w-5 h-5 ${statusColors[status as keyof typeof statusColors] || statusColors.stopped}`} />
                <span className="font-semibold text-sm capitalize">{status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stats.tag || "Bot not connected"}</p>
              <p className="text-xs text-muted-foreground mt-1">Uptime: {fmtUptime(stats.uptime)}</p>
            </CardContent>
          </Card>

          {[
            { label: "Servers", value: stats.guilds, color: "text-primary" },
            { label: "Commands", value: stats.commands, color: "text-purple-400" },
            { label: "Ping", value: stats.ping ? `${stats.ping}ms` : "—", color: "text-green-400" },
          ].map(s => (
            <Card key={s.label} className="border-card-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Bot Controls</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => controlMutation.mutate("start")}
                disabled={isPending || isRunning || status === "starting"}
                data-testid="button-start-bot"
              >
                {isPending && controlMutation.variables === "start" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Bot
              </Button>
              <Button
                variant="destructive"
                onClick={() => controlMutation.mutate("stop")}
                disabled={isPending || !isRunning}
                data-testid="button-stop-bot"
              >
                {isPending && controlMutation.variables === "stop" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                Stop Bot
              </Button>
              <Button
                variant="outline"
                onClick={() => controlMutation.mutate("restart")}
                disabled={isPending || !isRunning}
                data-testid="button-restart-bot"
              >
                {isPending && controlMutation.variables === "restart" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Restart Bot
              </Button>
              <div className="ml-auto flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={downloadLogs} disabled={allLogs.length === 0} data-testid="button-download-logs">
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={autoScroll ? "border-primary text-primary" : ""}
                  data-testid="button-toggle-autoscroll"
                >
                  Auto-Scroll {autoScroll ? "ON" : "OFF"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log Viewer */}
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                Live Console
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{filteredLogs.length} / {allLogs.length} entries</Badge>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter logs..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="pl-8 h-8 text-xs w-48"
                    data-testid="input-log-filter"
                  />
                  {filter && (
                    <button onClick={() => setFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="bg-black/30 rounded-b-lg">
              <ScrollArea className="h-96">
                <div className="font-mono text-xs p-4 space-y-1" ref={scrollAreaRef} data-testid="container-full-logs">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16">
                      {filter ? "No logs match your filter" : "No logs yet — start the bot to see activity"}
                    </div>
                  ) : (
                    filteredLogs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-3 ${getLogColor(log.text)}`} data-testid={`log-line-${i}`}>
                        <span className="text-muted-foreground/40 shrink-0 select-none w-20">
                          {new Date(log.t).toLocaleTimeString("en-US", { hour12: false })}
                        </span>
                        <span className="break-all leading-relaxed">{log.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Hosting Info */}
        <Card className="border-card-border border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm text-foreground mb-2">Running 24/7</h3>
            <p className="text-xs text-muted-foreground mb-3">
              To keep your bot online 24/7 for free, use UptimeRobot to ping your Replit URL every 5 minutes.
              This prevents Replit from sleeping your project.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Step 1: Get your URL</p>
                <p className="text-muted-foreground">Copy your Replit project URL from the browser address bar</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Step 2: Set up UptimeRobot</p>
                <p className="text-muted-foreground">Go to uptimerobot.com, add HTTP monitor, paste your URL, set 5-min interval</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Step 3: Deploy to Vercel (optional)</p>
                <p className="text-muted-foreground">The frontend dashboard can be deployed to Vercel for a permanent URL</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Step 4: Keep-Alive Endpoint</p>
                <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">/api/health</code>
                <p className="text-muted-foreground mt-1">Ping this endpoint with UptimeRobot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

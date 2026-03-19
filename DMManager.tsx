import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare, Send, Search, Loader2, RefreshCw, AlertCircle,
  Bell, BellOff, Radio, ExternalLink, CheckCheck, ChevronRight, Server
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DMThread { userId: string; username: string; avatarUrl?: string; lastMessage: string; lastMessageAt: string; messageCount: number; unread: boolean; }
interface DMMessage { id: string; content: string; fromBot: boolean; timestamp: string; authorName: string; }
interface Mention { _id: string; guildName: string; channelName: string; userId: string; username: string; displayName?: string; avatarUrl?: string; content: string; messageUrl?: string; context?: string; read: boolean; timestamp: string; }
interface Guild { id: string; name: string; iconURL?: string; memberCount: number; channels: { id: string; name: string; type: number }[]; }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`; if (h > 0) return `${h}h ago`; if (m > 0) return `${m}m ago`; return "just now";
}

function Avatar({ url, name, size = "md" }: { url?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-11 h-11 text-sm" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full bg-muted flex items-center justify-center font-bold flex-shrink-0 overflow-hidden`}>
      {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Tab: Direct Messages ───────────────────────────────────────────────────────
function DMTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");

  const { data: dmData, isLoading: threadsLoading, refetch } = useQuery<{ threads: DMThread[] }>({ queryKey: ["/api/dms"], refetchInterval: 10000 });
  const { data: msgData, isLoading: msgsLoading } = useQuery<{ messages: DMMessage[]; userId: string; username: string; avatarUrl?: string }>({
    queryKey: ["/api/dms", selectedUserId], enabled: !!selectedUserId, refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (data: { userId: string; message: string }) => apiRequest("POST", "/api/dms/send", data),
    onSuccess: () => { toast({ title: "✅ Message sent!" }); setReplyText(""); qc.invalidateQueries({ queryKey: ["/api/dms"] }); qc.invalidateQueries({ queryKey: ["/api/dms", selectedUserId] }); },
    onError: (e: any) => toast({ title: "Failed to send", description: e?.message || "Bot may be offline.", variant: "destructive" }),
  });

  const threads = dmData?.threads || [];
  const filtered = search ? threads.filter(t => t.username.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase())) : threads;
  const messages = msgData?.messages || [];
  const sel = threads.find(t => t.userId === selectedUserId);
  const unreadCount = threads.filter(t => t.unread).length;

  return (
    <div className="flex gap-4 h-[calc(100vh-16rem)]">
      {/* Thread list */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="p-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Conversations
              {unreadCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px]">{unreadCount}</Badge>}
            </span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => refetch()} data-testid="button-refresh-dms">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-xs" data-testid="input-search-dms" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {threadsLoading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4">
              <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No DMs yet</p>
              <p className="text-[11px] opacity-50 mt-1">Users who DM your bot appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(t => (
                <button key={t.userId} onClick={() => setSelectedUserId(t.userId)}
                  className={`w-full p-3 text-left transition-all hover:bg-accent/50 ${selectedUserId === t.userId ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                  data-testid={`button-dm-thread-${t.userId}`}>
                  <div className="flex items-start gap-2">
                    <Avatar url={t.avatarUrl} name={t.username} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold truncate ${selectedUserId === t.userId ? "text-primary" : ""}`}>{t.username}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(t.lastMessageAt)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.lastMessage}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/50">{t.messageCount} msg{t.messageCount !== 1 ? "s" : ""}</span>
                        {t.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message pane */}
      <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-border/50 bg-card overflow-hidden">
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-14 h-14 mb-3 opacity-10" />
            <p className="font-medium text-sm">Select a conversation</p>
            <p className="text-xs opacity-50 mt-1">Choose a user to view & reply to their DMs</p>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-border/50 flex items-center gap-2.5 flex-shrink-0">
              <Avatar url={sel?.avatarUrl} name={sel?.username || "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{sel?.username || "Unknown"}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{selectedUserId}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{messages.length} msgs</Badge>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedUserId(null)} data-testid="button-close-thread">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {msgsLoading ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 text-xs"><AlertCircle className="w-8 h-8 mb-2 mx-auto opacity-20" /><p>No messages yet</p></div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} className={`flex gap-2 ${msg.fromBot ? "flex-row-reverse" : ""}`} data-testid={`message-${msg.id || i}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${msg.fromBot ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.fromBot ? "B" : (sel?.username || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className={`max-w-[72%] flex flex-col gap-0.5 ${msg.fromBot ? "items-end" : "items-start"}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.fromBot ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                          {msg.content}
                        </div>
                        <span className={`text-[10px] text-muted-foreground flex items-center gap-1 ${msg.fromBot ? "flex-row-reverse" : ""}`}>
                          <span>{msg.fromBot ? "Bot" : msg.authorName}</span><span>•</span><span>{timeAgo(msg.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t border-border/50 flex-shrink-0">
              <div className="flex gap-2">
                <Textarea placeholder={`Reply to ${sel?.username || "user"} as the bot...`} value={replyText} onChange={e => setReplyText(e.target.value)}
                  className="resize-none text-sm min-h-[56px] max-h-28" onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && replyText.trim() && selectedUserId) sendMutation.mutate({ userId: selectedUserId, message: replyText.trim() }); }}
                  data-testid="textarea-reply" />
                <Button onClick={() => { if (replyText.trim() && selectedUserId) sendMutation.mutate({ userId: selectedUserId, message: replyText.trim() }); }}
                  disabled={!replyText.trim() || sendMutation.isPending} className="flex-shrink-0 self-end" data-testid="button-send-dm">
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter to send</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Owner Mentions ────────────────────────────────────────────────────────
function MentionsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Mention | null>(null);

  const { data, isLoading, refetch } = useQuery<{ mentions: Mention[]; unreadCount: number }>({ queryKey: ["/api/mentions"], refetchInterval: 15000 });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/mentions/read-all", {}),
    onSuccess: () => { toast({ title: "✅ All mentions marked as read." }); qc.invalidateQueries({ queryKey: ["/api/mentions"] }); },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/mentions/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/mentions"] }),
  });

  const mentions = data?.mentions || [];
  const unread = data?.unreadCount || 0;

  return (
    <div className="flex gap-4 h-[calc(100vh-16rem)]">
      {/* Mention list */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="p-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-red-400" /> Mentions
              {unread > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px] bg-red-500">{unread}</Badge>}
            </span>
            <div className="flex gap-1">
              {unread > 0 && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => markAllRead.mutate()} title="Mark all read" data-testid="button-mark-all-read">
                  <CheckCheck className="w-3 h-3" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => refetch()} data-testid="button-refresh-mentions">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
          ) : mentions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4">
              <BellOff className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No mentions yet</p>
              <p className="text-[11px] opacity-50 mt-1">When someone pings you, it appears here</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {mentions.map(m => (
                <button key={m._id} onClick={() => { setSelected(m); if (!m.read) markRead.mutate(m._id); }}
                  className={`w-full p-3 text-left transition-all hover:bg-accent/50 ${selected?._id === m._id ? "bg-red-500/10 border-l-2 border-red-400" : ""}`}
                  data-testid={`button-mention-${m._id}`}>
                  <div className="flex items-start gap-2">
                    <Avatar url={m.avatarUrl} name={m.username} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{m.displayName || m.username}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(m.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70">{m.guildName} • #{m.channelName}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{m.content.replace(/<@!?\d+>/g, "@mention")}</p>
                      {!m.read && <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block mt-1" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail pane */}
      <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-border/50 bg-card overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Bell className="w-14 h-14 mb-3 opacity-10" />
            <p className="font-medium text-sm">Select a mention</p>
            <p className="text-xs opacity-50 mt-1">View full context of who mentioned you</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar url={selected.avatarUrl} name={selected.username} size="lg" />
                <div>
                  <p className="font-bold">{selected.displayName || selected.username}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selected.userId}</p>
                </div>
                {selected.messageUrl && (
                  <a href={selected.messageUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 text-xs text-primary hover:underline" data-testid="link-jump-to-message">
                    <ExternalLink className="w-3.5 h-3.5" /> Jump to message
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[["🏠 Server", selected.guildName], ["💬 Channel", `#${selected.channelName}`], ["🕐 Time", new Date(selected.timestamp).toLocaleString()]].map(([label, value]) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-xs font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1.5">💬 Message</p>
                <p className="text-sm leading-relaxed">{selected.content}</p>
              </div>

              {selected.context && (
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1.5">📜 Context (messages before)</p>
                  <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{selected.context}</pre>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

// ── Tab: Server Broadcast ──────────────────────────────────────────────────────
function BroadcastTab() {
  const { toast } = useToast();
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [message, setMessage] = useState("");

  const { data: guildsData, isLoading } = useQuery<{ guilds: Guild[] }>({ queryKey: ["/api/guilds"], refetchInterval: 30000 });
  const guilds = guildsData?.guilds || [];
  const guild = guilds.find(g => g.id === selectedGuild);
  const channels = guild?.channels || [];

  const sendMutation = useMutation({
    mutationFn: (data: { channelId: string; message: string }) => apiRequest("POST", "/api/guilds/send", data),
    onSuccess: () => { toast({ title: "✅ Message sent to server!" }); setMessage(""); },
    onError: (e: any) => toast({ title: "Failed to send", description: e?.message || "Bot may not have access.", variant: "destructive" }),
  });

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Broadcast Message</h3>
          <Badge variant="secondary" className="text-[10px]">{guilds.length} servers</Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-xs py-4"><Loader2 className="w-4 h-4 animate-spin" />Loading servers...</div>
        ) : guilds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="w-10 h-10 mb-2 mx-auto opacity-20" />
            <p className="text-sm">No servers available</p>
            <p className="text-xs opacity-60 mt-1">Bot must be online to load server list</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Select Server</label>
                <Select value={selectedGuild} onValueChange={v => { setSelectedGuild(v); setSelectedChannel(""); }} data-testid="select-guild">
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose a server..." />
                  </SelectTrigger>
                  <SelectContent>
                    {guilds.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          {g.iconURL && <img src={g.iconURL} alt="" className="w-4 h-4 rounded-full" />}
                          {g.name}
                          <span className="text-muted-foreground text-[10px]">({g.memberCount.toLocaleString()} members)</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGuild && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Select Channel</label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel} data-testid="select-channel">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(c => (
                        <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
                <Textarea placeholder="Write your message to send to the server..." value={message} onChange={e => setMessage(e.target.value)}
                  className="resize-none text-sm min-h-[100px]" data-testid="textarea-broadcast" />
              </div>
            </div>

            <Button onClick={() => { if (selectedChannel && message.trim()) sendMutation.mutate({ channelId: selectedChannel, message: message.trim() }); }}
              disabled={!selectedChannel || !message.trim() || sendMutation.isPending} className="w-full" data-testid="button-send-broadcast">
              {sendMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send to #{channels.find(c => c.id === selectedChannel)?.name || "channel"}</>}
            </Button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">⚠️ Note</p>
        <p className="text-xs text-muted-foreground">Messages are sent directly by the bot. Make sure you have the bot in the target server and it has permission to send messages in the selected channel.</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dms", label: "Direct Messages", icon: MessageSquare },
  { id: "mentions", label: "Server Mentions", icon: Bell },
  { id: "broadcast", label: "Server Broadcast", icon: Radio },
] as const;

export default function DMManager() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("dms");

  const { data: mentionData } = useQuery<{ unreadCount: number }>({ queryKey: ["/api/mentions"], refetchInterval: 30000 });
  const { data: dmData } = useQuery<{ threads: { unread: boolean }[] }>({ queryKey: ["/api/dms"], refetchInterval: 30000 });
  const dmUnread = (dmData?.threads || []).filter(t => t.unread).length;
  const mentionUnread = mentionData?.unreadCount || 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 animate-slide-in-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Message Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage DMs, track server mentions, and broadcast to any server</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-muted/40 rounded-lg p-1 w-fit">
          {TABS.map(tab => {
            const count = tab.id === "dms" ? dmUnread : tab.id === "mentions" ? mentionUnread : 0;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all relative ${activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-${tab.id}`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <Badge className={`h-4 min-w-4 px-1 text-[10px] ml-1 ${tab.id === "mentions" ? "bg-red-500" : ""}`}>{count}</Badge>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "dms" && <DMTab />}
        {activeTab === "mentions" && <MentionsTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
      </div>
    </div>
  );
}

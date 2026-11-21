import { useState } from "react";
import {
  Users,
  Check,
  ShieldCheck,
  LogOut,
  Sparkles,
  Send,
  UserCheck,
  CheckCircle2,
  X,
  UserPlus,
  Crown,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiPost } from "@/lib/api";
import { saveSession } from "@/lib/local";
import type { QRDSession } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  session: QRDSession | null;
  onSessionUpdated(session: QRDSession): void;
}

export default function GroupModal({
  open,
  onOpenChange,
  session,
  onSessionUpdated,
}: Props) {
  // Target table and chair for outgoing request
  const [requestMode, setRequestMode] = useState<"cross_table" | "same_table">("cross_table");
  const [sameTableOption, setSameTableOption] = useState<"no_phone" | "has_phone">("no_phone");
  const [targetTable, setTargetTable] = useState("T-05");
  const [targetChair, setTargetChair] = useState(2);
  const [customTableInput, setCustomTableInput] = useState("");
  const [dinerName, setDinerName] = useState(session?.user_name || "Host");

  // Incoming request state
  const [incomingRequest, setIncomingRequest] = useState<{
    fromTable: string;
    fromChair: number;
    active: boolean;
  }>({
    fromTable: "T-05",
    fromChair: 2,
    active: true,
  });

  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isGrouped = !!session?.group_id;
  const currentTable = session?.table_id || "T-04";
  const currentChair = session?.chair_id || 1;
  const effectiveTargetTable = requestMode === "same_table" ? currentTable : (customTableInput.trim() || targetTable);

  const handleUpdateName = (newName: string) => {
    setDinerName(newName);
    if (session) {
      const updated = { ...session, user_name: newName };
      saveSession(updated);
      onSessionUpdated(updated);
    }
  };

  const handleClaimGuestChairDirectly = (chairNum: number) => {
    if (!session) return;
    const currentClaimed = session.claimed_chairs || [currentChair];
    if (currentClaimed.includes(chairNum)) {
      toast.info(`Chair ${chairNum} is already claimed in your dining party.`);
      return;
    }
    const updatedChairs = [...currentClaimed, chairNum].sort((a, b) => a - b);
    const updated: QRDSession = {
      ...session,
      party_size: updatedChairs.length,
      seats_count: updatedChairs.length,
      claimed_chairs: updatedChairs,
      guest_seats: updatedChairs.filter((c) => c !== currentChair),
    };
    saveSession(updated);
    onSessionUpdated(updated);
    toast.success(`Chair ${chairNum} directly claimed for Guest without phone!`, {
      description: `You can now order food for Chair ${chairNum} directly from the menu.`,
    });
    onOpenChange(false);
  };

  const handleSendRequest = () => {
    setRequestSent(true);
    const message = requestMode === "same_table"
      ? `Group request sent: "Chair ${currentChair} of Table ${currentTable} wants to group with Chair ${targetChair}"`
      : `Group request sent: "Chair ${currentChair} of Table ${currentTable} wants to group with Chair ${targetChair} of Table ${effectiveTargetTable}"`;

    toast.success(message, {
      description: "Waiting for them to tap [Accept & Group] on their screen.",
    });
  };

  const handleAcceptRequest = () => {
    if (!session) return;
    setLoading(true);
    const updated: QRDSession = {
      ...session,
      group_id: `GRP-${incomingRequest.fromTable}-${incomingRequest.fromChair}`,
      linked_table_id: incomingRequest.fromTable,
      linked_members: [
        { table_id: session.table_id, chairs: session.claimed_chairs || [currentChair], name: dinerName || "Your Table" },
        { table_id: incomingRequest.fromTable, chairs: [incomingRequest.fromChair], name: `Chair ${incomingRequest.fromChair}` },
      ],
    };
    saveSession(updated);
    onSessionUpdated(updated);
    setIncomingRequest({ ...incomingRequest, active: false });
    toast.success(`Connected! You are now grouped with Chair ${incomingRequest.fromChair} of Table ${incomingRequest.fromTable}.`, {
      description: "Both chairs can now view the shared cart and order for each other.",
    });
    setLoading(false);
    onOpenChange(false);
  };

  const handleDeclineRequest = () => {
    setIncomingRequest({ ...incomingRequest, active: false });
    toast.info("Group request declined.");
  };

  const handleLeaveGroup = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updated = await apiPost<QRDSession>("/group/leave", {
        session_id: session.id,
      });
      saveSession(updated);
      onSessionUpdated(updated);
      toast.info("Left the group. Your table is now independent.");
      onOpenChange(false);
    } catch {
      const updated: QRDSession = {
        ...session,
        group_id: null,
        linked_table_id: null,
        linked_members: [],
      };
      saveSession(updated);
      onSessionUpdated(updated);
      toast.info("Left the group. Your table is now independent.");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-sheet max-h-[90vh] w-[95vw] sm:max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950/95 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl"
        data-testid="group-management-modal"
      >
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl animate-aura-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />

        <DialogHeader className="relative pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-purple-800/10 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-heading text-base sm:text-lg font-black text-white tracking-tight">
                  Table & Chair Grouping
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  1-Click request handshake to connect dining parties
                </DialogDescription>
              </div>
            </div>

            <div className="self-start sm:self-auto">
              {isGrouped ? (
                <Badge className="border-purple-500/40 bg-purple-500/20 text-purple-300 font-extrabold text-[11px] px-2.5 py-1">
                  ● Group Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-muted-foreground text-[11px] px-2.5 py-1">
                  Single Table
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Current Active Seating Card */}
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-base shadow">
                {currentChair === 1 ? <Crown className="h-5 w-5 text-amber-400" /> : <Users className="h-5 w-5 text-amber-400" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Position:</span>
                  <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                    Table {currentTable} • Chair {currentChair}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">Claimed:</span>
                  <span className="text-[11px] font-semibold text-amber-300 truncate">
                    {session?.claimed_chairs && session.claimed_chairs.length > 1
                      ? `Chairs ${session.claimed_chairs.join(", ")} (${session.claimed_chairs.length} Seats)`
                      : `Chair ${currentChair} (Only You)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Name Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 self-start sm:self-auto">
              <UserCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Your Name</span>
                <input
                  type="text"
                  value={dinerName}
                  onChange={(e) => handleUpdateName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-24 bg-transparent text-xs font-black text-white outline-none placeholder:text-muted-foreground focus:text-amber-300"
                />
              </div>
            </div>
          </div>

          {/* Connected Group Status Banner (If already grouped) */}
          {isGrouped && (
            <div className="mt-3.5 rounded-2xl border border-purple-500/40 bg-purple-950/30 p-3 sm:p-3.5 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-black text-white">
                      <span>Table {currentTable}</span>
                      <span className="text-purple-300 font-normal">⇄</span>
                      <span className="text-purple-200">Table {session?.linked_table_id || "T-05"}</span>
                      <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-200">
                        #{session?.group_id}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300/80 mt-0.5">
                      Both tables merged! 4 Chairs actively connected on shared cart.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveGroup}
                  disabled={loading}
                  className="h-8 shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-300 hover:bg-red-500/20 self-start sm:self-auto"
                >
                  <LogOut className="h-3 w-3 mr-1" /> Leave Group
                </Button>
              </div>

              {/* Connected Chairs Breakdown Across Both Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-purple-500/20 pt-2.5">
                {/* Your Table Members */}
                <div className="rounded-xl bg-black/50 border border-white/10 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white mb-2">
                    <span className="text-amber-400">📍 Table {currentTable} (Your Table)</span>
                    <span className="text-[9px] text-muted-foreground font-semibold">2 Chairs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-black text-amber-300 flex items-center gap-1">
                      👑 Chair 1 ({dinerName || "You"})
                    </span>
                    <span className="rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                      👤 Chair 2 (Guest)
                    </span>
                  </div>
                </div>

                {/* Linked Table Members */}
                <div className="rounded-xl bg-black/50 border border-purple-500/30 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white mb-2">
                    <span className="text-purple-300">📍 Table {session?.linked_table_id || "T-05"} (Linked)</span>
                    <span className="text-[9px] text-purple-300/70 font-semibold">2 Chairs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-purple-500/25 border border-purple-500/40 px-2.5 py-1 text-[10px] font-black text-purple-200 flex items-center gap-1">
                      👑 Chair 1 (Friend)
                    </span>
                    <span className="rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                      👤 Chair 2 (Friend Guest)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1. INCOMING REQUEST ALERT (Simple Handshake Card) */}
        {incomingRequest.active && !isGrouped && (
          <div className="relative mt-3.5 overflow-hidden rounded-2xl border-2 border-purple-500/60 bg-gradient-to-br from-purple-900/40 via-purple-950/50 to-black p-3.5 sm:p-4 shadow-[0_0_25px_rgba(168,85,247,0.25)] animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/30 text-purple-200 border border-purple-500/50 shadow-md">
                <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-purple-500/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-200 border border-purple-400/30">
                  🔔 Incoming Request
                </span>

                <h4 className="mt-1 font-heading text-sm sm:text-base font-black text-white">
                  Chair {incomingRequest.fromChair} of Table {incomingRequest.fromTable} wants to group with you!
                </h4>
                <p className="mt-0.5 text-xs text-purple-200/90 leading-relaxed">
                  Accept to share the menu and order together. Other chairs remain completely separate.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptRequest}
                    disabled={loading}
                    className="h-9 sm:h-10 gap-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-5 text-xs font-black text-black shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Accept & Group</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeclineRequest}
                    className="h-9 sm:h-10 rounded-xl text-xs text-muted-foreground hover:text-white hover:bg-white/[0.08]"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEND GROUP REQUEST SECTION */}
        <div className="mt-3.5 rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-heading text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <Send className="h-4 w-4 text-purple-400" />
                <span>Send Group Request</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                A simple request will be sent to their screen to accept
              </p>
            </div>
          </div>

          {/* Grouping Mode: Another Table VS Same Table */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-xl bg-white/[0.04] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setRequestMode("cross_table");
                setRequestSent(false);
              }}
              className={`rounded-lg py-2 text-[11px] sm:text-xs font-bold transition-all ${
                requestMode === "cross_table"
                  ? "bg-purple-600 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Another Table
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestMode("same_table");
                setRequestSent(false);
              }}
              className={`rounded-lg py-2 text-[11px] sm:text-xs font-bold transition-all ${
                requestMode === "same_table"
                  ? "bg-purple-600 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Same Table (Chair)
            </button>
          </div>

          {/* If Same Table Mode: Choice between Claim Directly (No Phone) vs Send Request to Active Phone */}
          {requestMode === "same_table" && (
            <div className="mt-3 space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Does this diner have a mobile phone?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSameTableOption("no_phone")}
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    sameTableOption === "no_phone"
                      ? "border-amber-500 bg-amber-500/20 text-white shadow-md shadow-amber-500/10"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                  }`}
                >
                  <p className="font-extrabold text-xs text-amber-300">👤 No Phone (Family/Guest)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Direct claim — no request needed!</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSameTableOption("has_phone")}
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    sameTableOption === "has_phone"
                      ? "border-purple-500 bg-purple-500/20 text-white shadow-md shadow-purple-500/10"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                  }`}
                >
                  <p className="font-extrabold text-xs text-purple-300">📱 Has Phone (Scanned QR)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sends prompt to their screen</p>
                </button>
              </div>
            </div>
          )}

          {/* Table Picker (When Cross-Table mode is active) */}
          {requestMode === "cross_table" && (
            <div className="mt-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Table:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {["T-05", "T-06", "T-07", "T-08"].map((tbl) => {
                  const isSelected = targetTable === tbl && !customTableInput;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => {
                        setTargetTable(tbl);
                        setCustomTableInput("");
                        setRequestSent(false);
                      }}
                      className={`h-9 rounded-xl border font-heading text-xs font-bold transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/25 text-white shadow-md shadow-purple-500/20 scale-[1.02]"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                      }`}
                    >
                      Table {tbl}
                    </button>
                  );
                })}
              </div>

              {/* Other Custom Table */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground shrink-0">Other Table:</span>
                <input
                  type="text"
                  value={customTableInput}
                  onChange={(e) => {
                    setCustomTableInput(e.target.value.toUpperCase());
                    setRequestSent(false);
                  }}
                  placeholder="e.g. T-12"
                  className="h-8 w-28 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-bold text-white uppercase outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Chair Picker */}
          <div className="mt-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Chair Number:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {[1, 2, 3, 4].map((chr) => {
                const isSelected = targetChair === chr;
                const isOwnChair = requestMode === "same_table" && chr === currentChair;
                const isAlreadyClaimed = requestMode === "same_table" && session?.claimed_chairs?.includes(chr);

                return (
                  <button
                    key={chr}
                    type="button"
                    disabled={isOwnChair}
                    onClick={() => {
                      setTargetChair(chr);
                      setRequestSent(false);
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-2 sm:p-2.5 transition-all ${
                      isOwnChair
                        ? "opacity-40 cursor-not-allowed border-white/5 bg-transparent"
                        : isSelected
                        ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/20 scale-[1.02]"
                        : isAlreadyClaimed
                        ? "border-green-500/40 bg-green-500/10 text-green-300"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                    }`}
                  >
                    <span className="text-sm sm:text-base">{chr === 1 ? "👑" : "👤"}</span>
                    <span className="mt-0.5 font-heading text-xs font-extrabold text-white">
                      Chair {chr}
                    </span>
                    {isOwnChair ? (
                      <span className="text-[9px] text-muted-foreground">(You)</span>
                    ) : isAlreadyClaimed ? (
                      <span className="text-[8px] font-bold text-green-400">Claimed ✓</span>
                    ) : isSelected ? (
                      <span className="mt-0.5 rounded-full bg-amber-500/30 px-1.5 py-0.2 text-[8px] font-black uppercase text-amber-300">
                        Selected
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Request Message Preview / Action Preview */}
          <div className="mt-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                {requestMode === "same_table" && sameTableOption === "no_phone"
                  ? "Direct Guest Claim (No Request):"
                  : "Request Notification to Send:"}
              </span>
            </div>
            <p className="mt-1 font-semibold text-white text-[11px] sm:text-xs">
              {requestMode === "same_table"
                ? sameTableOption === "no_phone"
                  ? `Directly adding Chair ${targetChair} to your session. No phone or handshake needed.`
                  : `"Chair ${currentChair} wants to group with Chair ${targetChair} of Table ${currentTable}"`
                : `"Chair ${currentChair} of Table ${currentTable} wants to group with Chair ${targetChair} of Table ${effectiveTargetTable}"`}
            </p>
          </div>

          {/* Action Button */}
          {requestMode === "same_table" && sameTableOption === "no_phone" ? (
            <Button
              onClick={() => handleClaimGuestChairDirectly(targetChair)}
              className="mt-3.5 h-11 sm:h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 font-heading text-xs font-black text-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Claim Chair {targetChair} as Guest (Directly Order)</span>
            </Button>
          ) : (
            <Button
              onClick={handleSendRequest}
              disabled={requestSent}
              className="mt-3.5 h-11 sm:h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 font-heading text-xs font-black text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
            >
              {requestSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Request Sent! Waiting for them to accept...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="truncate">
                    {requestMode === "same_table"
                      ? `Send Request to Phone on Chair ${targetChair} →`
                      : `Send Request to Chair ${targetChair} of Table ${effectiveTargetTable} →`}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Safety Guarantee */}
        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2 font-bold text-white text-[11px] sm:text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Zero Stranger Pollution Guaranteed</span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] leading-relaxed text-emerald-200/80">
            Only Chair {targetChair} will be linked. Strangers at other chairs remain 100% separate with their own tab.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.08] pt-3">
          <span className="text-[10px] sm:text-[11px] text-muted-foreground">
            1-Click Handshake replaces complex QR / PIN codes.
          </span>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-8 sm:h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/[0.05]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Name: Kabir Sheikh
 * Intent: Professional Recruitment Dashboard with real-time scoring.
 * 
 * Displays the AI interview chat on the left and a live candidate dashboard
 * on the right showing progress, per-question scores, strengths, and areas
 * for improvement — all synced in real time via Durable Object state.
 */

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Button, Badge, InputArea, Surface, Text, Toasty } from "@cloudflare/kumo";
import { Streamdown } from "streamdown";
import {
  PaperPlaneRight,
  Stop,
  Trash,
  ChatCircleDots,
  UserFocus,
  ChartBar,
  ClipboardText,
  Trophy,
  Star,
  Warning
} from "@phosphor-icons/react";

// Match the CandidateState interface from server.ts
interface CandidateStats {
  score: number;
  questionCount: number;
  strengths: string[];
  areasForImprovement: string[];
  currentFocus: string;
  questionsAsked: string[];
  questionScores: number[];
  interviewComplete: boolean;
}

const DEFAULT_STATS: CandidateStats = {
  score: 0,
  questionCount: 0,
  strengths: [],
  areasForImprovement: [],
  currentFocus: "Introduction",
  questionsAsked: [],
  questionScores: [],
  interviewComplete: false,
};

function ScoreBadge({ score }: { score: number }) {
  if (score >= 0.75) return <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">✓ {score}/1</span>;
  if (score >= 0.25) return <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">◐ {score}/1</span>;
  return <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">✗ {score}/1</span>;
}

function Chat() {
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<CandidateStats>(DEFAULT_STATS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = useAgent({
    agent: "ChatAgent",
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
  });

  const updateStats = async () => {
    try {
      const s = await agent.call("getCandidateStats");
      if (s) setStats(s as CandidateStats);
    } catch (e) {
      // Silently ignore if agent isn't ready yet
    }
  };

  const handleClear = async () => {
    try {
      if (agent && connected) {
        await agent.call("resetState");
      }
    } catch (e) { }
    clearHistory();
    setStats(DEFAULT_STATS);
  };

  const { messages, sendMessage, clearHistory, status, stop } = useAgentChat({
    agent,
    onFinish: updateStats
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  };

  // Filter messages to only show ones with actual text content
  const visibleMessages = messages.filter(m =>
    m.parts?.some(p => p.type === "text" && (p as any).text?.trim())
  );

  const scorePercent = stats.questionCount > 0
    ? Math.round((stats.score / stats.questionCount) * 100)
    : 0;

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col border-r border-zinc-200 ">
        <header className="p-6 border-b border-zinc-200 bg-white shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">CF</div>
            <div>
              <h1 className="text-lg font-bold">Cloudflare Recruiter AI</h1>
              <Text size="xs" variant="secondary">Engineering Internship Pipeline • 2026</Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={connected ? "primary" : "destructive"}>{connected ? "Online" : "Offline"}</Badge>
            <Button size="sm" variant="secondary" onClick={handleClear}>
              <div className="flex items-center gap-2"><Trash size={14} /> Clear</div>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {visibleMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
              <ChatCircleDots size={48} weight="thin" />
              <div className="mt-4 italic text-sm">Say "Hello" to begin your technical screening.</div>
            </div>
          )}
          {visibleMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white border border-zinc-200 rounded-bl-none'}`}>
                {m.parts?.filter(p => p.type === 'text' && (p as any).text?.trim()).map((p: any, j) => (
                  <Streamdown key={j}>{p.text}</Streamdown>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-6 bg-white border-t border-zinc-200 ">
          <div className="flex gap-4 max-w-4xl mx-auto" onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e as any);
            }
          }}>
            <InputArea
              value={input}
              onValueChange={setInput}
              placeholder={stats.interviewComplete ? "Interview complete — review your results!" : "Type your answer here..."}
              className="flex-1 border-zinc-300 focus:ring-orange-500"
            />
            <Button type="button" variant="primary" onClick={(e: any) => isStreaming ? stop() : send(e)}>
              {isStreaming ? <Stop size={20} /> : <PaperPlaneRight size={20} />}
            </Button>
          </div>
        </footer>
      </div>

      {/* Sidebar Dashboard */}
      <div className="w-80 bg-white p-8 space-y-6 hidden lg:block border-l border-zinc-200 overflow-y-auto">
        {/* Candidate Details */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold uppercase tracking-widest text-[10px]">
            <UserFocus weight="bold" /> Candidate Details
          </div>
          <div className="font-bold text-xl">Kabir Sheikh</div>
          <div className="text-zinc-500 text-sm">University of South Florida</div>
        </section>

        {/* Live Progress */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-[10px]">
            <ChartBar weight="bold" /> Live Progress
          </div>
          <Surface className="p-5 border border-zinc-100 rounded-xl bg-slate-50 /50 shadow-inner">
            <div className="flex justify-between mb-3 text-[10px] font-bold text-zinc-500">
              <span>INTERVIEW STATUS</span>
              <span>{stats.questionCount}/5</span>
            </div>
            <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-600 h-full transition-all duration-1000 ease-in-out" style={{ width: `${(stats.questionCount / 5) * 100}%` }} />
            </div>
            {stats.questionCount > 0 && (
              <div className="mt-3 text-center">
                <span className="text-2xl font-black text-orange-600">{stats.score}</span>
                <span className="text-sm text-zinc-400">/{stats.questionCount}</span>
                <div className="text-[10px] text-zinc-500 mt-1">{scorePercent}% accuracy</div>
              </div>
            )}
          </Surface>
        </section>

        {/* Per-Question Scores */}
        {(stats.questionScores?.length || 0) > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-violet-600 font-bold uppercase tracking-widest text-[10px]">
              <Star weight="bold" /> Question Scores
            </div>
            <div className="space-y-2">
              {stats.questionScores?.map((score, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 /50 border border-zinc-100 ">
                  <span className="text-[11px] text-zinc-600 truncate mr-2">Q{i + 1}</span>
                  <ScoreBadge score={score} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strengths */}
        {(stats.strengths?.length || 0) > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
              <Trophy weight="bold" /> Strengths
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.strengths?.map((s, i) => (
                <span key={i} className="px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Areas for Improvement */}
        {(stats.areasForImprovement?.length || 0) > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-widest text-[10px]">
              <Warning weight="bold" /> Growth Areas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.areasForImprovement?.map((a, i) => (
                <span key={i} className="px-2 py-1 text-[10px] font-medium bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Current Focus */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
            <ClipboardText weight="bold" /> Recruiter Insight
          </div>
          <div className="p-4 border-l-2 border-emerald-600 bg-emerald-600/5 italic text-[11px] leading-relaxed text-zinc-700 rounded-r-lg">
            {stats.interviewComplete
              ? `"Interview complete! Final score: ${stats.score}/5 (${Math.round((stats.score / 5) * 100)}%)."`
              : `"Analyzing candidate depth in: ${stats.currentFocus}."`
            }
          </div>
        </section>

        {/* Final Score (if complete) */}
        {stats.interviewComplete && (
          <section className="space-y-3">
            <Surface className="p-5 border-2 border-orange-300 rounded-xl bg-orange-50 /20 text-center">
              <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">Final Score</div>
              <div className="text-4xl font-black text-orange-600">{stats.score}<span className="text-lg text-zinc-400">/5</span></div>
              <div className="text-sm text-zinc-600 mt-1">{Math.round((stats.score / 5) * 100)}%</div>
            </Surface>
          </section>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Toasty>
      <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-orange-600">Loading Interview Portal...</div>}>
        <Chat />
      </Suspense>
    </Toasty>
  );
}
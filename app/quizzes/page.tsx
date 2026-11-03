"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import {
  Lightning,
  Trophy,
  CalendarBlank,
  Timer,
  Users,
  Certificate,
  Funnel,
  MagnifyingGlass,
  ArrowRight,
  Sparkle,
  ShieldCheck,
  CheckCircle,
  CaretRight,
  ListNumbers,
} from "@phosphor-icons/react";

interface QuizItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "ARCHIVED";
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  maxParticipants: number | null;
  negativeMarking: boolean;
  certificatesEnabled: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    questions: number;
    registrations: number;
    attempts: number;
  };
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "LIVE" | "UPCOMING" | "PAST">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    async function loadQuizzes() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/v1/quizzes");
        const data = await res.json();
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : (data.data?.quizzes || []);
          setQuizzes(list);
        }
      } catch (err: unknown) {
        console.error("Failed to load quizzes", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  // Classify quizzes
  const categorized = useMemo(() => {
    return quizzes.map((q) => {
      const start = new Date(q.startsAt).getTime();
      const end = new Date(q.endsAt).getTime();
      let state: "LIVE" | "UPCOMING" | "PAST" = "PAST";
      if (currentTime && currentTime >= start && currentTime <= end) {
        state = "LIVE";
      } else if (currentTime && currentTime < start) {
        state = "UPCOMING";
      }
      return { ...q, liveState: state };
    });
  }, [quizzes, currentTime]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.category?.name) set.add(q.category.name);
    });
    return Array.from(set);
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return categorized.filter((q) => {
      const matchesTab = activeTab === "ALL" || q.liveState === activeTab;
      const matchesCategory =
        selectedCategory === "ALL" || q.category?.name === selectedCategory;
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [categorized, activeTab, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1B3360] via-[#23437D] to-[#101E35] text-white p-8 sm:p-12 shadow-lg border border-slate-700/30">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#FC6235]/30 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-xs border border-white/20">
              <Sparkle weight="fill" className="w-3.5 h-3.5 text-[#FC6235]" />
              REVERSUN Season League 2026
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              All Competitions & Live Quizzes
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Explore scheduled academic and technical sprints. Win cash prizes, accumulate leaderboard points, and earn cryptographically verified digital certificates.
            </p>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
            {(
              [
                { id: "ALL", label: "All Sprints", pulse: false },
                { id: "LIVE", label: "Live Now", pulse: true },
                { id: "UPCOMING", label: "Upcoming", pulse: false },
                { id: "PAST", label: "Completed", pulse: false },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-[#1B3360] text-white shadow-xs"
                    : "text-[#5C6E87] hover:text-[#101E35]"
                }`}
              >
                {tab.pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E9EDF5] bg-white text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
            />
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-[#FC6235] text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-[#E9EDF5] hover:bg-slate-50"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#FC6235] text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-[#E9EDF5] hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Quizzes Grid */}
        {isLoading ? (
          <div className="p-16 text-center text-[#5C6E87] bg-white rounded-3xl border border-[#E9EDF5]">
            <p className="text-xs font-semibold animate-pulse">Loading competitions from Neon DB...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="p-16 text-center text-[#5C6E87] bg-white rounded-3xl border border-[#E9EDF5] space-y-2">
            <Lightning weight="duotone" className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-[#101E35]">No competitions found</p>
            <p className="text-xs text-slate-400">Try selecting a different tab or clearing your search filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => {
              const isLive = quiz.liveState === "LIVE";
              const isUpcoming = quiz.liveState === "UPCOMING";
              const isPast = quiz.liveState === "PAST";

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-xs hover:shadow-md hover:border-[#FC6235]/40 transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isLive
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : isUpcoming
                            ? "bg-blue-50 text-[#1B3360] border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                        {isLive ? "LIVE NOW" : isUpcoming ? "UPCOMING" : "COMPLETED"}
                      </span>

                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          quiz.difficulty === "HARD"
                            ? "bg-rose-100 text-rose-800"
                            : quiz.difficulty === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base text-[#101E35] group-hover:text-[#FC6235] transition leading-snug">
                      {quiz.title}
                    </h3>

                    {/* Category */}
                    {quiz.category && (
                      <div className="text-xs text-[#5C6E87] font-semibold flex items-center gap-1">
                        <span>Category:</span>
                        <span className="text-[#1B3360]">{quiz.category.name}</span>
                      </div>
                    )}

                    {/* Description */}
                    {quiz.description && (
                      <p className="text-xs text-[#5C6E87] line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E9EDF5] text-xs text-[#5C6E87]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Timer weight="bold" className="w-4 h-4 text-[#FC6235]" />
                        <span>{quiz.durationMinutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <ListNumbers weight="bold" className="w-4 h-4 text-[#1B3360]" />
                        <span>{quiz._count.questions} questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users weight="bold" className="w-4 h-4 text-emerald-600" />
                        <span>{quiz._count.attempts} attempts</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Certificate weight="bold" className="w-4 h-4 text-[#FC6235]" />
                        <span>Certificates</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 mt-4 border-t border-[#E9EDF5]">
                    {isLive ? (
                      <Link
                        href={`/quizzes/${quiz.slug}/play`}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-xs transition"
                      >
                        <Lightning weight="fill" className="w-4 h-4" />
                        Enter Competition Now
                      </Link>
                    ) : isUpcoming ? (
                      <button
                        onClick={() => alert(`Registration confirmed for ${quiz.title}! You will be alerted when it goes live.`)}
                        className="w-full py-2.5 rounded-xl bg-[#1B3360] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#152749] shadow-xs transition"
                      >
                        <CalendarBlank weight="bold" className="w-4 h-4" />
                        Register for Competition
                      </button>
                    ) : (
                      <Link
                        href={`/quizzes/${quiz.slug}/play`}
                        className="w-full py-2.5 rounded-xl bg-white border border-[#E9EDF5] hover:bg-slate-50 text-[#1B3360] text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition"
                      >
                        <Trophy weight="duotone" className="w-4 h-4 text-[#FC6235]" />
                        Practice / Review Test
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

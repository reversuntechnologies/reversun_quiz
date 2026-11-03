"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNavbar from "@/components/PublicNavbar";
import {
  Trophy,
  Lightning,
  Fire,
  CalendarBlank,
  Timer,
  Certificate,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkle,
  MagnifyingGlass,
  CheckCircle,
  Gift,
  ArrowSquareOut,
  CaretRight,
  Medal,
  ChartBar,
  User,
  CircleNotch,
} from "@phosphor-icons/react";

export default function HomePage() {
  const router = useRouter();
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"weekly" | "all-time">("weekly");
  const [activeQuizTab, setActiveQuizTab] = useState<"live" | "upcoming" | "past">("live");
  const [certQuery, setCertQuery] = useState("");

  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
    async function loadQuizzes() {
      try {
        const res = await fetch("/api/v1/quizzes");
        const data = await res.json();
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : (data.data?.quizzes || []);
          setDbQuizzes(list);
        }
      } catch (err) {
        console.error("Failed to load home quizzes", err);
      } finally {
        setIsLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, []);

  const liveQuizzes = useMemo(() => {
    if (!now) return [];
    return dbQuizzes.filter((q) => {
      const s = new Date(q.startsAt).getTime();
      const e = new Date(q.endsAt).getTime();
      return now >= s && now <= e;
    });
  }, [dbQuizzes, now]);

  const upcomingQuizzes = useMemo(() => {
    if (!now) return dbQuizzes;
    return dbQuizzes.filter((q) => {
      const s = new Date(q.startsAt).getTime();
      return now < s;
    });
  }, [dbQuizzes, now]);

  const pastQuizzes = useMemo(() => {
    if (!now) return [];
    return dbQuizzes.filter((q) => {
      const e = new Date(q.endsAt).getTime();
      return now > e;
    });
  }, [dbQuizzes, now]);

  const weeklyTopPlayers = [
    { rank: 1, name: "Vikramaditya S.", points: 420, attended: 6, wins: 4, avatar: "VS" },
    { rank: 2, name: "Ananya Iyer", points: 360, attended: 5, wins: 3, avatar: "AI" },
    { rank: 3, name: "Karthik Raja", points: 310, attended: 6, wins: 2, avatar: "KR" },
    { rank: 4, name: "Meera Nair", points: 280, attended: 4, wins: 1, avatar: "MN" },
    { rank: 5, name: "Rahul Deshmukh", points: 240, attended: 5, wins: 1, avatar: "RD" },
  ];

  const allTimeTopPlayers = [
    { rank: 1, name: "Aarav Sundaram", points: 3420, attended: 42, wins: 28, avatar: "AS" },
    { rank: 2, name: "Vikramaditya S.", points: 2980, attended: 38, wins: 21, avatar: "VS" },
    { rank: 3, name: "Sneha Mukherjee", points: 2640, attended: 35, wins: 18, avatar: "SM" },
    { rank: 4, name: "Rohan Patel", points: 2310, attended: 31, wins: 14, avatar: "RP" },
    { rank: 5, name: "Ananya Iyer", points: 2190, attended: 29, wins: 12, avatar: "AI" },
  ];

  const currentLeaderboard = activeLeaderboardTab === "weekly" ? weeklyTopPlayers : allTimeTopPlayers;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
      <PublicNavbar />

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-[#E9EDF5] bg-gradient-to-b from-[#FFFDF9] to-[#FAF9F6]">
        {/* Soft Ambient Brand Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#FC6235]/10 via-[#1B3360]/5 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF4EF] border border-[#FC6235]/25 text-[#FC6235] text-xs font-bold mb-8 shadow-sm">
            <Sparkle weight="fill" className="w-4 h-4 text-[#FC6235]" />
            <span>REVERSUN Season 2026 League • Weekly Cash Rewards & Verifiable Certificates</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#101E35] leading-tight max-w-4xl mx-auto">
            Test Your Knowledge.{" "}
            <span className="bg-gradient-to-r from-[#FC6235] to-[#FF5D37] bg-clip-text text-transparent">
              Compete Live.
            </span>{" "}
            Win Real Prizes.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#5C6E87] max-w-2xl mx-auto leading-relaxed font-normal">
            The official competition arena by REVERSUN. Participate in scheduled quizzes, track weekly and all-time points on an immutable ledger, and receive cryptographically verified digital certificates.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#competitions"
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:shadow-lg hover:shadow-[#FC6235]/30 transition flex items-center gap-2"
            >
              <Lightning weight="fill" className="w-4 h-4 text-white" />
              Explore Live & Upcoming Quizzes
            </a>
            <a
              href="#leaderboard"
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 border border-[#E9EDF5] text-[#1B3360] shadow-sm transition flex items-center gap-2"
            >
              <Trophy weight="duotone" className="w-4 h-4 text-[#FC6235]" />
              View Leaderboards
            </a>
          </div>

          {/* Key Metrics Cards in Light Theme */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm">
              <div className="text-3xl font-extrabold text-[#FC6235]">₹2,50,000+</div>
              <div className="text-xs text-[#5C6E87] mt-1 font-semibold uppercase tracking-wider">Prizes Awarded</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm">
              <div className="text-3xl font-extrabold text-[#1B3360]">14,200+</div>
              <div className="text-xs text-[#5C6E87] mt-1 font-semibold uppercase tracking-wider">Active Competitors</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm">
              <div className="text-3xl font-extrabold text-[#101E35]">99.8%</div>
              <div className="text-xs text-[#5C6E87] mt-1 font-semibold uppercase tracking-wider">Server Precision</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm">
              <div className="text-3xl font-extrabold text-[#FC6235]">100%</div>
              <div className="text-xs text-[#5C6E87] mt-1 font-semibold uppercase tracking-wider">Verified Digital Certificates</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* LEADERBOARD SECTION (Section 3.1: All-Time & Weekly) */}
      {/* ------------------------------------------------------------- */}
      <section id="leaderboard" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[#E9EDF5]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-2">
              <Trophy weight="duotone" className="w-4 h-4" />
              <span>Hall of Champions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101E35]">
              Platform Rankings
            </h2>
            <p className="text-[#5C6E87] text-sm mt-1">
              All-time legacy points and weekly seasonal standings calculated from the permanent points ledger.
            </p>
          </div>

          <div className="flex items-center p-1.5 rounded-xl bg-white border border-[#E9EDF5] shadow-sm">
            <button
              onClick={() => setActiveLeaderboardTab("weekly")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition ${
                activeLeaderboardTab === "weekly"
                  ? "bg-[#1B3360] text-white shadow"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              Weekly Rankings (Asia/Kolkata)
            </button>
            <button
              onClick={() => setActiveLeaderboardTab("all-time")}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition ${
                activeLeaderboardTab === "all-time"
                  ? "bg-[#1B3360] text-white shadow"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              All-Time Legends
            </button>
          </div>
        </div>

        {/* Podium for Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
          {/* Rank 2 - Silver */}
          <div className="p-6 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm flex flex-col items-center text-center relative order-2 md:order-1">
            <div className="absolute -top-3.5 px-3.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase border border-slate-300">
              Rank 2 • Silver
            </div>
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-[#1B3360] font-black text-xl mb-4 shadow-sm">
              {currentLeaderboard[1].avatar}
            </div>
            <h3 className="font-bold text-lg text-[#101E35]">{currentLeaderboard[1].name}</h3>
            <p className="text-[#FC6235] font-extrabold text-2xl mt-1">{currentLeaderboard[1].points} pts</p>
            <div className="flex items-center gap-4 text-xs text-[#5C6E87] mt-4 pt-4 border-t border-[#E9EDF5] w-full justify-center">
              <span>{currentLeaderboard[1].attended} Quizzes</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">{currentLeaderboard[1].wins} Wins</span>
            </div>
          </div>

          {/* Rank 1 - Gold Champion */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-[#FFF4EF] to-white border-2 border-[#FC6235]/40 shadow-md flex flex-col items-center text-center relative order-1 md:order-2 scale-105">
            <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <Trophy weight="fill" className="w-3.5 h-3.5 text-white" />
              Rank 1 • Champion
            </div>
            <div className="w-20 h-20 rounded-full bg-[#FFF4EF] border-4 border-[#FC6235] flex items-center justify-center text-[#FC6235] font-black text-2xl mb-4 shadow-md">
              {currentLeaderboard[0].avatar}
            </div>
            <h3 className="font-extrabold text-xl text-[#101E35]">{currentLeaderboard[0].name}</h3>
            <p className="text-[#FC6235] font-black text-3xl mt-1">{currentLeaderboard[0].points} pts</p>
            <div className="flex items-center gap-5 text-xs text-[#5C6E87] mt-5 pt-4 border-t border-[#FC6235]/20 w-full justify-center">
              <span className="font-semibold">{currentLeaderboard[0].attended} Quizzes</span>
              <span>•</span>
              <span className="text-[#FC6235] font-bold">{currentLeaderboard[0].wins} First-place Victories</span>
            </div>
          </div>

          {/* Rank 3 - Bronze */}
          <div className="p-6 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm flex flex-col items-center text-center relative order-3">
            <div className="absolute -top-3.5 px-3.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wider uppercase border border-amber-300">
              Rank 3 • Bronze
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-800 font-black text-xl mb-4 shadow-sm">
              {currentLeaderboard[2].avatar}
            </div>
            <h3 className="font-bold text-lg text-[#101E35]">{currentLeaderboard[2].name}</h3>
            <p className="text-[#FC6235] font-extrabold text-2xl mt-1">{currentLeaderboard[2].points} pts</p>
            <div className="flex items-center gap-4 text-xs text-[#5C6E87] mt-4 pt-4 border-t border-[#E9EDF5] w-full justify-center">
              <span>{currentLeaderboard[2].attended} Quizzes</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">{currentLeaderboard[2].wins} Wins</span>
            </div>
          </div>
        </div>

        {/* Remaining Top Players Table */}
        <div className="rounded-2xl border border-[#E9EDF5] overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F6] text-xs font-bold text-[#5C6E87] uppercase tracking-wider border-b border-[#E9EDF5]">
              <tr>
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Player</th>
                <th className="py-4 px-6">Total Points</th>
                <th className="py-4 px-6">Quizzes Attended</th>
                <th className="py-4 px-6 text-right">Victories</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDF5] font-medium text-[#101E35]">
              {currentLeaderboard.slice(3).map((player) => (
                <tr key={player.rank} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6 font-bold text-[#5C6E87]">#{player.rank}</td>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFF4EF] text-[#FC6235] border border-[#FC6235]/30 flex items-center justify-center text-xs font-bold">
                      {player.avatar}
                    </div>
                    <span className="font-semibold text-[#101E35]">{player.name}</span>
                  </td>
                  <td className="py-4 px-6 text-[#FC6235] font-bold">{player.points} pts</td>
                  <td className="py-4 px-6 text-[#5C6E87]">{player.attended}</td>
                  <td className="py-4 px-6 text-right text-emerald-600 font-semibold">{player.wins} wins</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-[#FAF9F6] border-t border-[#E9EDF5] text-center">
            <Link
              href="/leaderboards"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6235] hover:underline"
            >
              <span>View Complete Seasonal & All-Time Rankings</span>
              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* COMPETITIONS SECTION (Live, Upcoming, Past) */}
      {/* ------------------------------------------------------------- */}
      <section id="competitions" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[#E9EDF5]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-2">
              <Lightning weight="duotone" className="w-4 h-4" />
              <span>Competitions Arena</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101E35]">
              Scheduled Quizzes
            </h2>
            <p className="text-[#5C6E87] text-sm mt-1">
              Participate with a server-controlled countdown timer, autosaved question engine, and guaranteed fair evaluation.
            </p>
          </div>

          <div className="flex items-center p-1.5 rounded-xl bg-white border border-[#E9EDF5] shadow-sm">
            <button
              onClick={() => setActiveQuizTab("live")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeQuizTab === "live"
                  ? "bg-red-600 text-white shadow"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live ({liveQuizzes.length})
            </button>
            <button
              onClick={() => setActiveQuizTab("upcoming")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeQuizTab === "upcoming"
                  ? "bg-[#1B3360] text-white shadow"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              Upcoming ({upcomingQuizzes.length})
            </button>
            <button
              onClick={() => setActiveQuizTab("past")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeQuizTab === "past"
                  ? "bg-slate-700 text-white shadow"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              Recently Completed
            </button>
          </div>
        </div>

        {/* Quiz Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoadingQuizzes ? (
            <div className="md:col-span-2 py-16 text-center space-y-3 bg-white rounded-3xl border border-[#E9EDF5]">
              <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading live competitions from server...</p>
            </div>
          ) : activeQuizTab === "live" ? (
            liveQuizzes.length === 0 ? (
              <div className="md:col-span-2 py-16 px-6 rounded-3xl bg-white border border-[#E9EDF5] text-center space-y-3 shadow-xs">
                <Lightning weight="duotone" className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-[#101E35]">No Live Competitions Right Now</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no competitions actively running at this exact minute. Check the Upcoming tab or explore all competitions.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveQuizTab("upcoming")}
                    className="px-4 py-2 bg-[#1B3360] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    View Upcoming
                  </button>
                  <Link
                    href="/quizzes"
                    className="px-4 py-2 bg-[#FAF9F6] text-[#FC6235] border border-[#FC6235]/30 text-xs font-bold rounded-xl shadow-xs"
                  >
                    All Competitions
                  </Link>
                </div>
              </div>
            ) : (
              liveQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-7 rounded-2xl bg-white border border-[#E9EDF5] hover:border-[#FC6235]/50 transition group flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-[#5C6E87]">
                        {quiz.category?.name || "General Knowledge"}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-red-50 text-red-600 border-red-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE NOW
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#101E35] group-hover:text-[#FC6235] transition">
                      {quiz.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-3 my-5 py-3.5 px-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] text-xs">
                      <div>
                        <div className="text-[#5C6E87] font-medium">Duration</div>
                        <div className="font-bold text-[#101E35] mt-0.5">{quiz.durationMinutes} mins</div>
                      </div>
                      <div>
                        <div className="text-[#5C6E87] font-medium">Questions</div>
                        <div className="font-bold text-[#101E35] mt-0.5">
                          {quiz.totalQuestions ?? quiz._count?.questions ?? 0} MCQs
                        </div>
                      </div>
                      <div>
                        <div className="text-[#5C6E87] font-medium">Difficulty</div>
                        <div className="font-bold text-[#FC6235] mt-0.5 uppercase">{quiz.difficulty}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E9EDF5] flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-[#5C6E87]">
                      <Users weight="duotone" className="w-4 h-4 text-[#FC6235]" />
                      <span>{quiz.participantCount ?? quiz._count?.registrations ?? 0} players</span>
                    </div>

                    <Link
                      href={`/quizzes/${quiz.slug}/play`}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 transition shadow-md shadow-[#FC6235]/25 flex items-center gap-1.5"
                    >
                      Enter Live Quiz
                      <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : activeQuizTab === "upcoming" ? (
            upcomingQuizzes.length === 0 ? (
              <div className="md:col-span-2 py-16 px-6 rounded-3xl bg-white border border-[#E9EDF5] text-center space-y-3 shadow-xs">
                <CalendarBlank weight="duotone" className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-[#101E35]">No Upcoming Competitions</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  New competitions are posted regularly by the administrative board.
                </p>
                <div className="pt-2">
                  <Link
                    href="/quizzes"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B3360] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <span>Browse Competition Catalog</span>
                    <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              upcomingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-7 rounded-2xl bg-white border border-[#E9EDF5] hover:border-[#1B3360]/40 transition group flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-[#5C6E87]">
                        {quiz.category?.name || "General"}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-blue-50 text-[#1B3360] border-blue-200">
                        UPCOMING
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#101E35] group-hover:text-[#1B3360] transition">
                      {quiz.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-3 my-5 py-3.5 px-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] text-xs">
                      <div>
                        <div className="text-[#5C6E87] font-medium">Starts</div>
                        <div className="font-bold text-[#101E35] mt-0.5 truncate">
                          {new Date(quiz.startsAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#5C6E87] font-medium">Questions</div>
                        <div className="font-bold text-[#101E35] mt-0.5">
                          {quiz.totalQuestions ?? quiz._count?.questions ?? 0} Questions
                        </div>
                      </div>
                      <div>
                        <div className="text-[#5C6E87] font-medium">Duration</div>
                        <div className="font-bold text-[#FC6235] mt-0.5">{quiz.durationMinutes} mins</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E9EDF5] flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-[#5C6E87]">
                      <Users weight="duotone" className="w-4 h-4 text-[#1B3360]" />
                      <span>{quiz.participantCount ?? quiz._count?.registrations ?? 0} enrolled</span>
                    </div>

                    <Link
                      href={`/quizzes/${quiz.slug}/play`}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1B3360] text-white hover:bg-[#14284D] transition shadow-md flex items-center gap-1.5"
                    >
                      View & Prepare
                      <CaretRight weight="bold" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )
          ) : pastQuizzes.length === 0 ? (
            <div className="md:col-span-2 py-16 px-6 rounded-3xl bg-white border border-[#E9EDF5] text-center space-y-3 shadow-xs">
              <Trophy weight="duotone" className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-base text-[#101E35]">No Concluded Quizzes Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Completed competition results and leaderboards will be cataloged here once closed.
              </p>
            </div>
          ) : (
            pastQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-7 rounded-2xl bg-white border border-[#E9EDF5] flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-[#5C6E87]">
                      {quiz.category?.name || "General"}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      COMPLETED
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#101E35]">{quiz.title}</h3>

                  <div className="my-5 p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] text-xs flex items-center justify-between">
                    <div>
                      <div className="text-[#5C6E87] font-medium">Difficulty</div>
                      <div className="font-bold text-[#FC6235] text-sm mt-0.5">{quiz.difficulty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#5C6E87] font-medium">Total Questions</div>
                      <div className="font-semibold text-[#101E35] mt-0.5">
                        {quiz.totalQuestions ?? quiz._count?.questions ?? 0} MCQs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E9EDF5] flex items-center justify-between mt-2">
                  <span className="text-xs text-[#5C6E87]">
                    {quiz.participantCount ?? quiz._count?.attempts ?? 0} total submissions
                  </span>

                  <Link
                    href={`/quizzes/${quiz.slug}/play`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#E9EDF5] text-[#1B3360] hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    View Details
                    <ArrowSquareOut weight="bold" className="w-3.5 h-3.5 text-[#FC6235]" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PUBLIC CERTIFICATE VERIFICATION (Section 3.5 & 7.5) */}
      {/* ------------------------------------------------------------- */}
      <section id="verification" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[#E9EDF5]">
        <div className="rounded-3xl bg-white border border-[#E9EDF5] p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-2">
              <Certificate weight="duotone" className="w-4 h-4" />
              <span>Public Verification Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101E35]">
              Verify Digital Certificates
            </h2>
            <p className="text-[#5C6E87] text-sm mt-2 leading-relaxed">
              Every REVERSUN certificate comes embedded with a cryptographic token and QR code. Anyone can verify participant credentials without requiring authentication.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (certQuery.trim()) {
                  router.push(`/certificates/verify?token=${encodeURIComponent(certQuery.trim())}`);
                }
              }}
              className="mt-6 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <MagnifyingGlass weight="bold" className="w-4 h-4 text-[#5C6E87] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Certificate Number (e.g. CERT-2026-000123)"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] text-sm text-[#101E35] placeholder-[#5C6E87] focus:outline-none focus:border-[#FC6235] transition"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 transition shadow-md shadow-[#FC6235]/25 whitespace-nowrap"
              >
                Verify Authenticity
              </button>
            </form>

            <div className="mt-4 flex items-center gap-6 text-xs text-[#5C6E87]">
              <span className="flex items-center gap-1.5">
                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                No login required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                Instant cryptographic proof
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                Audit recorded
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* REWARDS & POINTS MATRIX (Section 4.3) */}
      {/* ------------------------------------------------------------- */}
      <section id="prizes" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[#E9EDF5]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-2">
            <Gift weight="duotone" className="w-4 h-4" />
            <span>Dual Reward System</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101E35]">
            Earn Prizes & Platform Points
          </h2>
          <p className="text-[#5C6E87] text-sm mt-2">
            Participate in competitions to win immediate monetary prizes while stacking lifetime points on the permanent ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card A: Per-Quiz Prizes */}
          <div className="p-8 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FFF4EF] border border-[#FC6235]/30 flex items-center justify-center mb-6">
                <Trophy weight="duotone" className="w-6 h-6 text-[#FC6235]" />
              </div>
              <h3 className="text-2xl font-bold text-[#101E35] mb-2">A. Per-Quiz Cash Prizes</h3>
              <p className="text-[#5C6E87] text-sm leading-relaxed mb-6">
                Awarded directly for high scores in each individual competitive quiz. Configured dynamically by contest organizers.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">1st Place Position</span>
                  <span className="font-extrabold text-[#FC6235]">₹2,000 + Gold Certificate</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">2nd Place Position</span>
                  <span className="font-extrabold text-[#1B3360]">₹1,000 + Silver Certificate</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">3rd Place Position</span>
                  <span className="font-extrabold text-amber-700">₹500 + Bronze Certificate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Cumulative Points */}
          <div className="p-8 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-6">
                <Fire weight="duotone" className="w-6 h-6 text-[#FC6235]" />
              </div>
              <h3 className="text-2xl font-bold text-[#101E35] mb-2">B. Cumulative Points Ledger</h3>
              <p className="text-[#5C6E87] text-sm leading-relaxed mb-6">
                Every quiz you finish adds permanent points to your profile ledger, elevating your position on global and weekly leaderboards.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">Complete a Quiz</span>
                  <span className="font-extrabold text-emerald-600">+10 Points</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">1st Place Victory</span>
                  <span className="font-extrabold text-emerald-600">+100 Points</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                  <span className="font-bold text-sm text-[#101E35]">2nd & 3rd Place Finish</span>
                  <span className="font-extrabold text-emerald-600">+60 / +40 Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* REVERSUN FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="mt-auto bg-white border-t border-[#E9EDF5] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image
                src="/REVERSUN LOGO.png"
                alt="REVERSUN"
                width={160}
                height={40}
                style={{ width: "auto", height: "36px" }}
                className="object-contain"
              />
              <div className="h-6 w-px bg-slate-200" />
              <p className="text-xs text-[#5C6E87]">
                Official Technical Quiz Platform v1.0 • Built with Next.js & Neon
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#5C6E87] font-semibold">
              <a href="#competitions" className="hover:text-[#FC6235] transition">Competitions</a>
              <a href="#leaderboard" className="hover:text-[#FC6235] transition">Leaderboards</a>
              <a href="#verification" className="hover:text-[#FC6235] transition">Verify Certificates</a>
              <Link href="/admin/dashboard" className="text-[#FC6235] hover:underline">Admin Portal</Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E9EDF5] text-center text-xs text-[#8E9EAF]">
            © 2026 REVERSUN. All rights reserved. Authoritative data stored in Neon PostgreSQL. Live presentations managed via Firebase RTDB.
          </div>
        </div>
      </footer>
    </div>
  );
}

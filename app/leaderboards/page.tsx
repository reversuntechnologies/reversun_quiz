"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import {
  Trophy,
  Medal,
  Sparkle,
  Crown,
  MagnifyingGlass,
  CheckCircle,
  Lightning,
  ShieldCheck,
  CalendarBlank,
  Star,
  Users,
} from "@phosphor-icons/react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  quizzesAttended: number;
  wins: number;
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "all-time">("weekly");
  const [weeklyData, setWeeklyData] = useState<LeaderboardEntry[]>([]);
  const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadLeaderboards() {
      setIsLoading(true);
      try {
        const [wRes, aRes] = await Promise.all([
          fetch("/api/v1/leaderboards/weekly"),
          fetch("/api/v1/leaderboards/all-time"),
        ]);
        const wData = await wRes.json();
        const aData = await aRes.json();

        if (wData.success && wData.data?.leaderboard) {
          setWeeklyData(wData.data.leaderboard);
        }
        if (aData.success && aData.data?.leaderboard) {
          setAllTimeData(aData.data.leaderboard);
        }
      } catch (err: unknown) {
        console.error("Failed to load leaderboards", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboards();
  }, []);

  // Fallback demo seed data if database has fresh or unranked points
  const activeList = activeTab === "weekly" ? weeklyData : allTimeData;
  const displayList: LeaderboardEntry[] = useMemo(() => {
    if (activeList.length > 0) return activeList;
    return activeTab === "weekly"
      ? [
          { rank: 1, userId: "u1", name: "Vikramaditya S.", avatarUrl: null, points: 420, quizzesAttended: 6, wins: 4 },
          { rank: 2, userId: "u2", name: "Ananya Iyer", avatarUrl: null, points: 360, quizzesAttended: 5, wins: 3 },
          { rank: 3, userId: "u3", name: "Karthik Raja", avatarUrl: null, points: 310, quizzesAttended: 6, wins: 2 },
          { rank: 4, userId: "u4", name: "Meera Nair", avatarUrl: null, points: 280, quizzesAttended: 4, wins: 1 },
          { rank: 5, userId: "u5", name: "Rahul Deshmukh", avatarUrl: null, points: 240, quizzesAttended: 5, wins: 1 },
        ]
      : [
          { rank: 1, userId: "u1", name: "Aarav Sundaram", avatarUrl: null, points: 3420, quizzesAttended: 42, wins: 28 },
          { rank: 2, userId: "u2", name: "Vikramaditya S.", avatarUrl: null, points: 2980, quizzesAttended: 38, wins: 21 },
          { rank: 3, userId: "u3", name: "Sneha Mukherjee", avatarUrl: null, points: 2640, quizzesAttended: 35, wins: 18 },
          { rank: 4, userId: "u4", name: "Rohan Patel", avatarUrl: null, points: 2310, quizzesAttended: 31, wins: 14 },
          { rank: 5, userId: "u5", name: "Ananya Iyer", avatarUrl: null, points: 2190, quizzesAttended: 29, wins: 12 },
        ];
  }, [activeList, activeTab]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return displayList;
    return displayList.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [displayList, searchQuery]);

  const top1 = displayList[0];
  const top2 = displayList[1];
  const top3 = displayList[2];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
      <PublicNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4EF] border border-[#FC6235]/25 text-[#FC6235] text-xs font-bold shadow-2xs">
            <Trophy weight="fill" className="w-4 h-4 text-[#FC6235]" />
            Official Platform Standings & Hall of Champions
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#101E35] tracking-tight">
            Leaderboard & Rankings
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E87]">
            Points are calculated on an immutable ledger across every sprint attended. Top podium holders qualify for cash rewards and verified honor credentials.
          </p>
        </div>

        {/* Tab Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center p-1.5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "weekly"
                  ? "bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white shadow-xs"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              <CalendarBlank weight="bold" className="w-4 h-4" />
              Weekly Champions
            </button>
            <button
              onClick={() => setActiveTab("all-time")}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "all-time"
                  ? "bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white shadow-xs"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              <Crown weight="bold" className="w-4 h-4" />
              All-Time Hall of Fame
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Find contestant rank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#E9EDF5] bg-white text-[#101E35] focus:outline-hidden focus:border-[#FC6235] shadow-xs"
            />
          </div>
        </div>

        {/* Podium Top 3 */}
        {!searchQuery && top1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end pt-8">
            {/* 2nd Place Silver */}
            {top2 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-xs flex flex-col items-center justify-between order-2 md:order-1 h-80">
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-black text-xl mx-auto shadow-xs">
                    {top2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    🥈 Rank 2 • Silver
                  </span>
                  <h3 className="font-extrabold text-base text-[#101E35]">{top2.name}</h3>
                </div>
                <div className="w-full pt-4 border-t border-slate-100">
                  <div className="text-2xl font-black text-[#1B3360]">{top2.points.toLocaleString()} pts</div>
                  <div className="text-[11px] text-slate-400">{top2.quizzesAttended} quizzes • {top2.wins} wins</div>
                </div>
              </div>
            )}

            {/* 1st Place Gold (Elevated) */}
            <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-3xl border-2 border-amber-300 p-6 text-center shadow-md flex flex-col items-center justify-between order-1 md:order-2 h-96 relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                <Crown weight="fill" className="w-6 h-6" />
              </div>

              <div className="space-y-3 mt-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center font-black text-2xl mx-auto shadow-md">
                  {top1.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                  🏆 Rank 1 • Grand Champion
                </span>
                <h3 className="font-black text-lg text-[#101E35]">{top1.name}</h3>
              </div>

              <div className="w-full pt-4 border-t border-amber-200/60">
                <div className="text-3xl font-black text-[#FC6235]">{top1.points.toLocaleString()} pts</div>
                <div className="text-[11px] font-bold text-[#5C6E87]">{top1.quizzesAttended} quizzes • {top1.wins} wins</div>
              </div>
            </div>

            {/* 3rd Place Bronze */}
            {top3 && (
              <div className="bg-white rounded-3xl border border-orange-200 p-6 text-center shadow-xs flex flex-col items-center justify-between order-3 md:order-3 h-76">
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 flex items-center justify-center font-black text-lg mx-auto shadow-xs">
                    {top3.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase bg-orange-100 text-orange-800 border border-orange-200">
                    🥉 Rank 3 • Bronze
                  </span>
                  <h3 className="font-extrabold text-sm text-[#101E35]">{top3.name}</h3>
                </div>
                <div className="w-full pt-4 border-t border-slate-100">
                  <div className="text-xl font-black text-[#101E35]">{top3.points.toLocaleString()} pts</div>
                  <div className="text-[11px] text-slate-400">{top3.quizzesAttended} quizzes • {top3.wins} wins</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Table */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E9EDF5] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E9EDF5] flex items-center justify-between">
            <h2 className="text-sm font-black text-[#101E35]">
              {activeTab === "weekly" ? "Weekly Season Standings" : "All-Time Honor Roll"}
            </h2>
            <span className="text-xs text-[#5C6E87]">
              {filteredList.length} ranked participants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E9EDF5] bg-[#FAF9F6] text-[11px] font-bold text-[#5C6E87] uppercase tracking-wider">
                  <th className="py-3 px-5">Rank</th>
                  <th className="py-3 px-5">Participant</th>
                  <th className="py-3 px-5 text-center">Quizzes</th>
                  <th className="py-3 px-5 text-center">Wins</th>
                  <th className="py-3 px-5 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {filteredList.map((entry) => {
                  const isGold = entry.rank === 1;
                  const isSilver = entry.rank === 2;
                  const isBronze = entry.rank === 3;

                  return (
                    <tr key={entry.userId} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                            isGold
                              ? "bg-amber-400 text-amber-950"
                              : isSilver
                              ? "bg-slate-300 text-slate-800"
                              : isBronze
                              ? "bg-amber-700 text-amber-100"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-700 flex items-center justify-center text-xs">
                            {entry.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#101E35]">{entry.name}</div>
                            {isGold && (
                              <span className="text-[10px] text-amber-700 font-bold">Grand Champion</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-center font-semibold text-[#101E35]">
                        {entry.quizzesAttended}
                      </td>

                      <td className="py-3.5 px-5 text-center font-semibold text-[#101E35]">
                        {entry.wins > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                            <Trophy weight="fill" className="w-3.5 h-3.5" />
                            {entry.wins}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right font-black text-[#FC6235] text-sm">
                        {entry.points.toLocaleString()} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Rules Explanation */}
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-[#FFF8F5] border border-[#FC6235]/30 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-black text-sm text-[#101E35] flex items-center gap-2">
              <Sparkle weight="fill" className="w-4 h-4 text-[#FC6235]" />
              Official League Scoring Matrix
            </h3>
            <p className="text-xs text-[#5C6E87] leading-relaxed">
              Every participant receives points on completion. Points count immediately towards seasonal weekly prizes and all-time hall of fame privileges.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <div className="p-2.5 rounded-xl bg-white border border-[#E9EDF5] flex justify-between">
              <span className="text-slate-600">Rank 1st:</span>
              <span className="text-[#FC6235]">+100 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#E9EDF5] flex justify-between">
              <span className="text-slate-600">Rank 2nd:</span>
              <span className="text-[#FC6235]">+75 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#E9EDF5] flex justify-between">
              <span className="text-slate-600">Rank 3rd:</span>
              <span className="text-[#FC6235]">+50 pts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#E9EDF5] flex justify-between">
              <span className="text-slate-600">Top 10 Finish:</span>
              <span className="text-[#FC6235]">+25 pts</span>
            </div>
            <div className="col-span-2 p-2.5 rounded-xl bg-white border border-[#E9EDF5] flex justify-between">
              <span className="text-slate-600">Participation (Every Test):</span>
              <span className="text-emerald-600">+10 pts</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

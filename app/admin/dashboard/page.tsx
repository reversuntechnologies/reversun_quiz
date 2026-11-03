"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Lightning,
  Trophy,
  CalendarBlank,
  Certificate,
  ChartLineUp,
  WarningCircle,
  PlusCircle,
  UploadSimple,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Medal,
} from "@phosphor-icons/react";

export default function AdminDashboardPage() {
  const stats = [
    { label: "Registered Users", value: "14,240", change: "+12.4%", icon: Users, color: "text-[#1B3360]" },
    { label: "Published Quizzes", value: "48", change: "+4 this week", icon: Lightning, color: "text-[#FC6235]" },
    { label: "Live Competitions", value: "2", change: "Active now", icon: WarningCircle, color: "text-red-600" },
    { label: "Upcoming Quizzes", value: "8", change: "Next 7 days", icon: CalendarBlank, color: "text-[#1B3360]" },
    { label: "Total Quiz Attempts", value: "32,850", change: "+18.2%", icon: ChartLineUp, color: "text-emerald-600" },
    { label: "Certificates Generated", value: "8,420", change: "+100%", icon: Certificate, color: "text-purple-600" },
    { label: "Prizes Awarded", value: "₹2,50,000", change: "Audited", icon: Trophy, color: "text-[#FC6235]" },
    { label: "Completed Competitions", value: "38", change: "Finalized", icon: Medal, color: "text-slate-600" },
  ];

  const recentAttempts = [
    { id: "att-101", user: "Vikramaditya S.", quiz: "REVERSUN AI Frontier Challenge", score: "24/25", status: "SUBMITTED", time: "2 mins ago" },
    { id: "att-102", user: "Ananya Iyer", quiz: "Full-Stack System Design Sprint", score: "18/20", status: "SUBMITTED", time: "8 mins ago" },
    { id: "att-103", user: "Rohan Patel", quiz: "REVERSUN AI Frontier Challenge", score: "22/25", status: "AUTO_SUBMITTED", time: "14 mins ago" },
    { id: "att-104", user: "Sneha Mukherjee", quiz: "Autumn Algorithm Championship", score: "29/30", status: "SUBMITTED", time: "1 hour ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Action Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EDF5] mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">Executive Dashboard & Analytics</h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] mt-1">
            Real-time competition monitoring, participant engagement, and system integrity metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert("Quiz Creation Modal: Create new competition with duration, difficulty, negative marking.")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FC6235] hover:bg-[#e05327] text-white transition flex items-center gap-1.5 shadow-sm shadow-[#FC6235]/25 cursor-pointer"
          >
            <PlusCircle weight="bold" className="w-4 h-4" />
            Create Quiz
          </button>
          <button
            onClick={() => alert("Bulk Question Importer: Upload CSV or predefined JSON template per Section 4.2.")}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#1B3360] border border-[#E9EDF5] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UploadSimple weight="bold" className="w-4 h-4" />
            Bulk Import
          </button>
        </div>
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#5C6E87]">{s.label}</span>
                  <Icon weight="duotone" className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-2xl font-extrabold text-[#101E35]">{s.value}</div>
                <div className="text-[11px] font-bold text-emerald-600 mt-1">{s.change}</div>
              </div>
            );
          })}
        </div>

        {/* Live Monitoring & Recent Attempts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-[#E9EDF5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#101E35]">Live Attempt Monitoring</h3>
                <p className="text-xs text-[#5C6E87]">Server deadlines, autosaved responses, and verification</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Monitoring
              </span>
            </div>

            <div className="divide-y divide-[#E9EDF5]">
              {recentAttempts.map((att) => (
                <div key={att.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-[#101E35]">{att.user}</div>
                    <div className="text-xs text-[#5C6E87] mt-0.5">{att.quiz}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#FC6235]">{att.score}</div>
                    <div className="text-[11px] text-[#8E9EAF] mt-0.5">{att.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="rounded-2xl bg-white border border-[#E9EDF5] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#101E35] mb-2">Competition Management</h3>
              <p className="text-xs text-[#5C6E87] mb-6">Audited admin operations and security controls</p>

              <div className="space-y-3">
                <button
                  onClick={() => alert("Managing Categories: Technology, Software, Science, General.")}
                  className="w-full text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] hover:border-[#1B3360]/30 transition flex items-center justify-between text-xs font-bold text-[#101E35]"
                >
                  <span>Manage Categories</span>
                  <ArrowUpRight weight="bold" className="w-4 h-4 text-[#5C6E87]" />
                </button>
                <button
                  onClick={() => alert("Scoring & Tie-break Rules: Evaluated on highest score, earliest submission, and timestamp.")}
                  className="w-full text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] hover:border-[#1B3360]/30 transition flex items-center justify-between text-xs font-bold text-[#101E35]"
                >
                  <span>Scoring & Tie-Break Policies</span>
                  <ArrowUpRight weight="bold" className="w-4 h-4 text-[#5C6E87]" />
                </button>
                <button
                  onClick={() => alert("Certificate Issuer: Trigger generation for published results.")}
                  className="w-full text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] hover:border-[#1B3360]/30 transition flex items-center justify-between text-xs font-bold text-[#101E35]"
                >
                  <span>Digital Certificate Dispatch</span>
                  <ArrowUpRight weight="bold" className="w-4 h-4 text-[#5C6E87]" />
                </button>
                <button
                  onClick={() => alert("Audit Logs: All score alterations, cancellations, and certificate revocations recorded.")}
                  className="w-full text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5] hover:border-[#1B3360]/30 transition flex items-center justify-between text-xs font-bold text-[#101E35]"
                >
                  <span>System Audit Logs</span>
                  <ArrowUpRight weight="bold" className="w-4 h-4 text-[#5C6E87]" />
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-[#FFF4EF] border border-[#FC6235]/25 text-xs text-[#101E35]">
              <span className="font-bold text-[#FC6235]">Architecture Rule:</span> Neon PostgreSQL is the authoritative source of truth. Firebase Realtime DB serves ephemeral presentation states.
            </div>
          </div>
        </div>
    </div>
  );
}

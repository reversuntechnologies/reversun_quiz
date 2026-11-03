"use client";

import React, { useEffect, useState } from "react";
import {
  Broadcast,
  Clock,
  Users,
  Lightning,
  WarningCircle,
  ArrowsClockwise,
  HourglassHigh,
  Prohibit,
  CheckCircle,
  PlusCircle,
  Eye,
  ShieldWarning,
} from "@phosphor-icons/react";

interface TelemetryData {
  serverTime: string;
  liveQuizzes: Array<{
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    startsAt: string;
    endsAt: string;
    category?: { name: string };
    _count: {
      questions: number;
      registrations: number;
      attempts: number;
    };
  }>;
  activeAttempts: Array<{
    id: string;
    startedAt: string;
    deadlineAt: string;
    user: { id: string; name: string; email: string };
    quiz: { id: string; title: string; durationMinutes: number };
    _count: { answers: number };
  }>;
  recentSubmissions: Array<{
    id: string;
    totalScore: number;
    maxScore: number;
    status: string;
    submittedAt: string;
    user: { id: string; name: string; email: string };
    quiz: { id: string; title: string };
  }>;
  summary: {
    totalUsers: number;
    totalAttempts: number;
    totalCertificates: number;
    liveQuizzesCount: number;
    activeConcurrentTakers: number;
  };
}

export default function AdminMonitoringPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedQuizForExtend, setSelectedQuizForExtend] = useState<string | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/v1/admin/monitoring");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load telemetry");
      }
      setTelemetry(data.data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching telemetry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExtendQuiz = async () => {
    if (!selectedQuizForExtend) return;
    setActionInProgress(true);
    try {
      const res = await fetch("/api/v1/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXTEND_QUIZ_TIME",
          quizId: selectedQuizForExtend,
          minutes: extendMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to extend quiz");
      }
      showToast(`Quiz extended by ${extendMinutes} minutes.`);
      setSelectedQuizForExtend(null);
      fetchTelemetry();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleInvalidateAttempt = async (attemptId: string, userName: string) => {
    if (!confirm(`Are you sure you want to invalidate ${userName}'s attempt for anti-cheat/integrity violation?`)) {
      return;
    }
    setActionInProgress(true);
    try {
      const res = await fetch("/api/v1/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INVALIDATE_ATTEMPT",
          attemptId,
          reason: "Administrator flagged attempt for integrity violation",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to invalidate attempt");
      }
      showToast(`Attempt invalidated for ${userName}.`);
      fetchTelemetry();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#101E35] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg border border-[#FC6235]/40 flex items-center gap-2">
          <CheckCircle weight="fill" className="w-4 h-4 text-[#FC6235]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-1">
            <Broadcast weight="duotone" className="w-4 h-4 animate-pulse" />
            <span>Mission Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35] flex items-center gap-3">
            Competition Telemetry
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY
            </span>
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1">
            Monitor active competitors, monitor live countdowns, and execute emergency administrative controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 shadow-2xs ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-600 border-[#E9EDF5]"
            }`}
          >
            <HourglassHigh weight="bold" className="w-3.5 h-3.5" />
            {autoRefresh ? "Auto-Refresh (8s)" : "Auto-Refresh Paused"}
          </button>

          <button
            onClick={fetchTelemetry}
            className="p-2 text-xs font-bold rounded-xl border border-[#E9EDF5] bg-white text-[#1B3360] hover:bg-slate-50 transition shadow-2xs"
            title="Refresh Now"
          >
            <ArrowsClockwise weight="bold" className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider flex items-center justify-between">
            <span>Concurrent Test Takers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {telemetry?.summary.activeConcurrentTakers ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">
            Live Competitions
          </div>
          <div className="text-3xl font-black text-[#FC6235] mt-1">
            {telemetry?.summary.liveQuizzesCount ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">
            Total Submissions
          </div>
          <div className="text-3xl font-black text-[#1B3360] mt-1">
            {telemetry?.summary.totalAttempts ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">
            Platform Users
          </div>
          <div className="text-3xl font-black text-[#101E35] mt-1">
            {telemetry?.summary.totalUsers ?? 0}
          </div>
        </div>
      </div>

      {/* Section 1: Active Live Quizzes */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#101E35] flex items-center gap-2">
            <Lightning weight="fill" className="w-4 h-4 text-[#FC6235]" />
            Currently Active Competitions
          </h2>
          <span className="text-xs font-semibold text-[#5C6E87]">
            {telemetry?.liveQuizzes.length || 0} active now
          </span>
        </div>

        {!telemetry?.liveQuizzes || telemetry.liveQuizzes.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F6] rounded-xl border border-dashed border-[#E9EDF5] text-xs text-[#5C6E87]">
            No quizzes are scheduled live at this exact moment. Scheduled quizzes will appear here automatically when their start time is reached.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {telemetry.liveQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 rounded-xl border border-[#E9EDF5] bg-[#FFFDFB] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      LIVE NOW
                    </span>
                    <span className="text-xs font-bold text-[#1B3360]">
                      {quiz.durationMinutes} mins duration
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#101E35]">{quiz.title}</h3>
                  <div className="text-xs text-[#5C6E87] mt-1 flex items-center gap-3">
                    <span>{quiz._count.questions} questions</span>
                    <span>•</span>
                    <span>{quiz._count.attempts} attempts logged</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9EDF5] flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Ends at: {new Date(quiz.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <button
                    onClick={() => setSelectedQuizForExtend(quiz.id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FC6235] text-white hover:bg-[#e05027] transition flex items-center gap-1 shadow-2xs"
                  >
                    <PlusCircle weight="bold" className="w-3.5 h-3.5" />
                    Extend Time
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extend Modal */}
      {selectedQuizForExtend && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E9EDF5]">
            <h3 className="text-base font-bold text-[#101E35] flex items-center gap-2">
              <Clock weight="fill" className="w-5 h-5 text-[#FC6235]" />
              Emergency Time Extension
            </h3>
            <p className="text-xs text-[#5C6E87]">
              Grant additional time to all current test-takers for server interruptions or network issues.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#101E35]">Extension Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setExtendMinutes(m)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      extendMinutes === m
                        ? "bg-[#FC6235] text-white border-[#FC6235]"
                        : "bg-slate-50 text-[#101E35] border-slate-200"
                    }`}
                  >
                    +{m} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQuizForExtend(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E9EDF5] text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionInProgress}
                onClick={handleExtendQuiz}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FC6235] text-white hover:bg-[#e05027] transition shadow-xs disabled:opacity-50"
              >
                {actionInProgress ? "Applying..." : "Apply Extension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Active Test Takers Table */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E9EDF5] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#101E35] flex items-center gap-2">
            <Users weight="duotone" className="w-4 h-4 text-[#1B3360]" />
            Active Test Takers (In Progress)
          </h2>
          <span className="text-xs text-[#5C6E87] font-semibold">
            {telemetry?.activeAttempts.length || 0} test-takers
          </span>
        </div>

        {!telemetry?.activeAttempts || telemetry.activeAttempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C6E87]">
            No candidates are currently actively taking a quiz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E9EDF5] bg-[#FAF9F6] text-[11px] font-bold text-[#5C6E87] uppercase tracking-wider">
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Quiz Title</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4 text-center">Answered</th>
                  <th className="py-3 px-4 text-right">Integrity Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {telemetry.activeAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#101E35]">{attempt.user.name}</div>
                      <div className="text-[11px] text-[#5C6E87]">{attempt.user.email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#101E35]">
                      {attempt.quiz.title}
                    </td>
                    <td className="py-3 px-4 text-[#5C6E87]">
                      {new Date(attempt.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[#101E35]">
                        {attempt._count.answers} Qs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInvalidateAttempt(attempt.id, attempt.user.name)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition flex items-center gap-1 ml-auto"
                        title="Invalidate attempt for cheating"
                      >
                        <ShieldWarning weight="fill" className="w-3.5 h-3.5" />
                        Invalidate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Recent Submissions Stream */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E9EDF5]">
          <h2 className="text-base font-bold text-[#101E35]">Recent Submissions Stream</h2>
        </div>

        {!telemetry?.recentSubmissions || telemetry.recentSubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C6E87]">
            No completed submissions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E9EDF5] text-xs">
            {telemetry.recentSubmissions.map((sub) => (
              <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-[#101E35]">{sub.user.name}</div>
                    <div className="text-[11px] text-[#5C6E87]">{sub.quiz.title}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-[#FC6235]">
                    {sub.totalScore} / {sub.maxScore} pts
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(sub.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

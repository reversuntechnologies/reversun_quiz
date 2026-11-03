"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Certificate,
  Trophy,
  CheckCircle,
  CircleNotch,
  Medal,
  Clock,
  Sparkle,
  ArrowSquareOut,
  FileArrowDown,
  Info,
} from "@phosphor-icons/react";

interface CompletedQuiz {
  id: string;
  title: string;
  slug: string;
  status: string;
  endsAt: string;
  category?: { name: string };
  _count: {
    results: number;
    attempts: number;
    certificates: number;
  };
}

interface ResultRecord {
  id: string;
  rank: number;
  position: number | null;
  score: number;
  isWinner: boolean;
  completionTimeMs: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RawSubmission {
  id: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
  startedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminResultsPage() {
  const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [rawSubmissions, setRawSubmissions] = useState<RawSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/results");
      const data = await res.json();
      if (data.success && data.data.completedQuizzes?.length > 0) {
        setCompletedQuizzes(data.data.completedQuizzes);
        setSelectedQuizId(data.data.completedQuizzes[0].id);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchResultsForQuiz = async (quizId: string) => {
    if (!quizId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/results?quizId=${quizId}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.results || []);
        setRawSubmissions(data.data.rawSubmissions || []);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      fetchResultsForQuiz(selectedQuizId);
    }
  }, [selectedQuizId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFinalizeAndIssue = async () => {
    if (!selectedQuizId) return;
    if (
      !confirm(
        "Finalize this competition? This will calculate official ranks, distribute points ledger entries, and issue verifiable digital certificates."
      )
    ) {
      return;
    }

    setIsFinalizing(true);
    try {
      const res = await fetch("/api/v1/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: selectedQuizId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to finalize results");
      }

      showToast(`Finalized! Evaluated ${data.data.evaluatedSubmissions} attempts and dispatched ${data.data.issuedCertificates} certificates.`);
      fetchResultsForQuiz(selectedQuizId);
      fetchQuizzes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Finalization failed");
    } finally {
      setIsFinalizing(false);
    }
  };

  const selectedQuiz = completedQuizzes.find((q) => q.id === selectedQuizId);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#101E35] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg border border-[#FC6235]/40 flex items-center gap-2">
          <CheckCircle weight="fill" className="w-4 h-4 text-[#FC6235]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FC6235] mb-1">
            <Certificate weight="duotone" className="w-4 h-4" />
            <span>Evaluation & Dispatch Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            Results & Certificates
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1">
            Apply automated tie-breaking rules, finalize podium rankings, credit points, and generate tamper-proof certificates.
          </p>
        </div>

        <button
          onClick={handleFinalizeAndIssue}
          disabled={isFinalizing || rawSubmissions.length === 0}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 transition shadow-sm flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
        >
          {isFinalizing ? (
            <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkle weight="fill" className="w-4 h-4" />
          )}
          {results.length > 0 ? "Re-evaluate & Update Certificates" : "Finalize & Issue Certificates"}
        </button>
      </div>

      {/* Selector and Tie-Breaker Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Select Competition</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="mt-2 text-xs font-bold px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] focus:outline-hidden"
          >
            {completedQuizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q._count.attempts} attempts)
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC6235]/30 flex items-start gap-3">
          <Info weight="fill" className="w-5 h-5 text-[#FC6235] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold text-[#101E35]">Official REVERSUN Tie-Breaker Protocol:</span>
            <p className="text-[#5C6E87] mt-0.5 leading-relaxed">
              1. Highest score achieved. <br />
              2. Earliest verified server completion timestamp (`submittedAt ASC`). If scores are identical, the candidate who completed earlier is awarded the superior rank.
            </p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E9EDF5] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#101E35]">
              {results.length > 0 ? "Official Finalized Standings" : "Pending Raw Submissions"}
            </h2>
            <p className="text-xs text-[#5C6E87] mt-0.5">
              {results.length > 0
                ? `${results.length} certified participants ranked`
                : `${rawSubmissions.length} raw submissions waiting to be finalized`}
            </p>
          </div>

          <Link
            href="/certificates/verify"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E9EDF5] bg-white text-[#1B3360] hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowSquareOut weight="bold" className="w-3.5 h-3.5 text-[#FC6235]" />
            Public Verification Portal
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[#5C6E87] flex flex-col items-center justify-center gap-2">
            <CircleNotch weight="bold" className="w-6 h-6 animate-spin text-[#FC6235]" />
            <span className="text-xs font-semibold">Loading standings...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E9EDF5] bg-[#FAF9F6] text-[11px] font-bold text-[#5C6E87] uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Podium Award</th>
                  <th className="py-3 px-4 text-center">Points Credited</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {results.map((r) => {
                  const is1st = r.rank === 1;
                  const is2nd = r.rank === 2;
                  const is3rd = r.rank === 3;
                  const pointsAwarded = is1st ? 100 : is2nd ? 75 : is3rd ? 50 : r.rank <= 10 ? 25 : 10;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/70 transition ${
                        is1st
                          ? "bg-amber-50/40"
                          : is2nd
                          ? "bg-slate-50/40"
                          : is3rd
                          ? "bg-orange-50/30"
                          : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            is1st
                              ? "bg-amber-400 text-amber-950"
                              : is2nd
                              ? "bg-slate-300 text-slate-800"
                              : is3rd
                              ? "bg-amber-700 text-amber-100"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#101E35]">{r.user.name}</div>
                        <div className="text-[11px] text-[#5C6E87]">{r.user.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-[#101E35]">
                        {Number(r.score)} pts
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {r.isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                            <Trophy weight="fill" className="w-3 h-3 text-amber-600" />
                            Winner
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Participant</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-[#FC6235]">
                        +{pointsAwarded} pts
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/certificates/verify?holder=${encodeURIComponent(r.user.name)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B3360] hover:text-[#FC6235] transition"
                        >
                          <Certificate weight="bold" className="w-3.5 h-3.5" />
                          View Certificate
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : rawSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E9EDF5] bg-[#FAF9F6] text-[11px] font-bold text-[#5C6E87] uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4 text-center">Raw Score</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {rawSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#101E35]">{sub.user.name}</div>
                      <div className="text-[11px] text-[#5C6E87]">{sub.user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#FC6235]">
                      {sub.totalScore} / {sub.maxScore}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(sub.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(sub.submittedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        PENDING FINALIZATION
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-[#5C6E87] flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF4EF] border border-[#FC6235]/30 text-[#FC6235] flex items-center justify-center shadow-xs">
              <Certificate weight="duotone" className="w-7 h-7 text-[#FC6235]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#101E35]">No Submissions Recorded Yet</h3>
              <p className="text-xs text-[#5C6E87] max-w-sm mx-auto leading-relaxed">
                When participants complete and submit attempts for this competition, their raw scores and completion timestamps will appear here for evaluation, ranking, and certificate issuance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

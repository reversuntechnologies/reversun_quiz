"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Check,
  CircleNotch,
  Sparkle,
  Question,
  CalendarBlank,
} from "@phosphor-icons/react";

interface OptionBreakdown {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
}

interface QuestionBreakdownItem {
  questionId: string;
  position: number;
  questionText: string;
  marks: number;
  explanation: string | null;
  options: OptionBreakdown[];
  correctOptionId?: string;
  correctOptionText?: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  isCorrect: boolean;
  isSkipped: boolean;
  awardedMarks: number;
}

interface AttemptItem {
  id: string;
  rank: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  timeSpentFormatted: string;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  questionBreakdown: QuestionBreakdownItem[];
}

interface QuizInfo {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  durationMinutes: number;
  negativeMarking: boolean;
  category?: { name: string } | null;
  totalQuestions: number;
}

function SubmissionsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [stats, setStats] = useState<{
    totalAttempts: number;
    completedCount: number;
    avgScore: string;
    highestScore: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptItem | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/admin/quizzes/${quizId}/submissions`);
        const data = await res.json();
        if (res.ok && data.success) {
          setQuiz(data.data.quiz);
          setAttempts(data.data.attempts || []);
          setStats(data.data.stats || null);
        }
      } catch (err) {
        console.error("Failed to load submissions", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSubmissions();
  }, [quizId]);

  const optionLetters = ["A", "B", "C", "D"];

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          Loading candidate submissions and answer keys...
        </p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-white rounded-3xl border border-[#E9EDF5] p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#101E35]">Quiz Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quiz could not be located in the database.
        </p>
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FC6235] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
          <span>Return to Quizzes</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EDF5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5C6E87] mb-2">
            <Link
              href="/admin/quizzes"
              className="hover:text-[#FC6235] flex items-center gap-1 transition"
            >
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              <span>Quizzes & Competitions</span>
            </Link>
            <span>/</span>
            <span className="text-[#101E35]">{quiz.title}</span>
            <span>/</span>
            <span className="text-[#FC6235]">User Answers</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            Candidate Attempts & Answer Sheets
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] mt-1">
            Review detailed question-by-question responses, scores, and timestamped logs for &ldquo;{quiz.title}&rdquo;.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/quizzes/${quiz.slug}/play`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-[#E9EDF5] bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>Preview Quiz</span>
            <span>↗</span>
          </Link>
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 rounded-xl bg-[#1B3360] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Attempts
            </div>
            <div className="text-2xl font-black text-[#101E35] mt-1">
              {stats.totalAttempts}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.completedCount} completed submissions
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-2xl font-black text-[#FC6235] mt-1">
              {stats.avgScore} pts
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across all graded candidates
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Highest Score
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {stats.highestScore} pts
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Peak candidate performance
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Questions in Quiz
            </div>
            <div className="text-2xl font-black text-[#1B3360] mt-1">
              {quiz.totalQuestions}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {quiz.durationMinutes} minutes duration
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E9EDF5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users weight="bold" className="w-4 h-4 text-[#FC6235]" />
            <h2 className="text-sm font-extrabold text-[#101E35]">
              Candidate Attempts List ({attempts.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click &ldquo;Inspect Answer Sheet&rdquo; to view candidate&apos;s chosen options.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E9EDF5] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70 text-[11px]">
                <th className="py-3.5 px-6">Rank</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Accuracy Breakdown</th>
                <th className="py-3.5 px-4">Time Taken</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-6 text-right">Answer Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDF5] font-medium text-[#101E35]">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 space-y-2">
                    <Users weight="duotone" className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-sm text-[#101E35]">No attempts recorded yet.</p>
                    <p className="text-xs text-slate-400">
                      When users sign in and attempt this quiz, their selected answers and scores will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-[#FFF4EF]/20 transition">
                    <td className="py-4 px-6 font-bold text-slate-500">
                      #{att.rank}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-[#101E35]">{att.user.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{att.user.email}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-black text-sm text-[#FC6235]">
                        {att.totalScore}
                      </span>
                      <span className="text-slate-400 font-medium text-xs"> / {att.maxScore} pts</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                          ✓ {att.correctCount} Correct
                        </span>
                        {att.incorrectCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold">
                            ✕ {att.incorrectCount} Wrong
                          </span>
                        )}
                        {att.skippedCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            — {att.skippedCount} Skipped
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">
                      {att.timeSpentFormatted}
                    </td>

                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : "In progress"}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedAttempt(att)}
                        className="px-3 py-1.5 rounded-xl bg-[#1B3360] hover:bg-[#152749] text-white text-[11px] font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
                      >
                        <Eye weight="bold" className="w-3.5 h-3.5" />
                        <span>Inspect Answers</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANDIDATE ANSWER SHEET MODAL */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E9EDF5] flex items-center justify-between bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FFF4EF] text-[#FC6235] text-[10px] font-bold uppercase tracking-wider border border-[#FC6235]/30">
                    Candidate Answer Sheet
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Attempt ID: {selectedAttempt.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#101E35]">
                  {selectedAttempt.user.name} ({selectedAttempt.user.email})
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    Score: <strong className="text-[#FC6235]">{selectedAttempt.totalScore}</strong> / {selectedAttempt.maxScore} pts
                  </span>
                  <span>•</span>
                  <span>Time: <strong>{selectedAttempt.timeSpentFormatted}</strong></span>
                  <span>•</span>
                  <span>
                    Results: <strong className="text-emerald-600">{selectedAttempt.correctCount} Correct</strong>,{" "}
                    <strong className="text-red-600">{selectedAttempt.incorrectCount} Incorrect</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X weight="bold" className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content: Questions & Answers */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {selectedAttempt.questionBreakdown.map((item, qIdx) => (
                <div
                  key={item.questionId}
                  className={`p-5 rounded-2xl border transition space-y-3.5 ${
                    item.isCorrect
                      ? "bg-emerald-50/30 border-emerald-200"
                      : item.isSkipped
                      ? "bg-slate-50 border-slate-200"
                      : "bg-red-50/30 border-red-200"
                  }`}
                >
                  {/* Question Title & Result Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-white border border-[#E9EDF5] text-[#101E35] font-black flex items-center justify-center text-xs">
                        #{qIdx + 1}
                      </span>
                      <span className="font-bold text-[#101E35] text-sm">
                        {item.questionText}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <CheckCircle weight="fill" className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Correct (+{item.awardedMarks} pts)</span>
                        </span>
                      ) : item.isSkipped ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                          <span>Skipped (0 pts)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                          <XCircle weight="fill" className="w-3.5 h-3.5 text-red-600" />
                          <span>Wrong ({item.awardedMarks} pts)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {item.options.map((opt, optIdx) => {
                      const isCandidatePick = item.selectedOptionId === opt.id;
                      const isCorrectKey = opt.isCorrect;

                      let containerStyle = "bg-white border-[#E9EDF5] text-slate-700";
                      let badge = null;

                      if (isCandidatePick && isCorrectKey) {
                        containerStyle = "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500/20";
                        badge = (
                          <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-black shrink-0">
                            ✓ Selected & Correct
                          </span>
                        );
                      } else if (isCandidatePick && !isCorrectKey) {
                        containerStyle = "bg-red-100 border-red-400 text-red-950 font-bold ring-2 ring-red-500/20";
                        badge = (
                          <span className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded font-black shrink-0">
                            ✕ Candidate Pick (Wrong)
                          </span>
                        );
                      } else if (isCorrectKey) {
                        containerStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold";
                        badge = (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black shrink-0">
                            ✓ Correct Key
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${containerStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 font-bold text-slate-400">
                              {optionLetters[optIdx]}.
                            </span>
                            <span>{opt.optionText}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if present */}
                  {item.explanation && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-600">
                      <strong className="text-slate-800">Explanation:</strong> {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E9EDF5] bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#E9EDF5] text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizSubmissionsPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
          <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
          <p className="text-xs font-bold text-slate-500">
            Loading candidate submissions...
          </p>
        </div>
      }
    >
      <SubmissionsContent params={props.params} />
    </Suspense>
  );
}

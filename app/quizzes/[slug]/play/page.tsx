"use client";

import React, { useEffect, useState, useMemo, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Timer,
  WarningCircle,
  CheckCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  ShieldWarning,
  Trophy,
  Certificate,
  ListNumbers,
  Sparkle,
  CircleNotch,
  LockKey,
} from "@phosphor-icons/react";
import { useUserAuth } from "@/context/UserAuthContext";

interface QuestionOption {
  id: string;
  optionText: string;
  position: number;
}

interface Question {
  id: string;
  position: number;
  questionText: string;
  imageUrl: string | null;
  type: string;
  marks: number;
  negativeMarks: number;
  options: QuestionOption[];
}

interface SubmissionBreakdownItem {
  questionId: string;
  questionText: string;
  selectedOptionId?: string;
  correctOptionId?: string;
  isCorrect: boolean;
  awardedMarks: number;
  explanation: string | null;
}

interface SubmissionResult {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracyPercentage: number;
  completionTimeFormatted: string;
  submittedAt: string;
  breakdown: SubmissionBreakdownItem[];
}

function QuizPlayContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user, isLoading: authLoading, loginWithGoogle, loginWithDemoGoogle } = useUserAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizInfo, setQuizInfo] = useState<{
    id: string;
    title: string;
    negativeMarking: boolean;
    totalQuestions: number;
  } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [reviewedQuestionIds, setReviewedQuestionIds] = useState<Set<string>>(new Set());

  // Timer & Anti-cheat
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [antiCheatAlert, setAntiCheatAlert] = useState<string | null>(null);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // Initialize quiz session only once user is authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const currentUser = user;

    async function startQuiz() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/quizzes/${slug}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: currentUser.email,
            userName: currentUser.name || currentUser.displayName || "Participant",
            userId: currentUser.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to initialize quiz");
        }

        setQuizInfo(data.data.quiz);
        setAttemptId(data.data.attempt.id);
        const deadline = new Date(data.data.attempt.deadlineAt);
        setDeadlineAt(deadline);
        setQuestions(data.data.questions);

        const diffSeconds = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
        setSecondsRemaining(diffSeconds);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error starting quiz");
      } finally {
        setIsLoading(false);
      }
    }
    startQuiz();
  }, [slug, user, authLoading]);

  // Countdown timer loop
  useEffect(() => {
    if (secondsRemaining === null || result !== null) return;

    if (secondsRemaining <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, result]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (result !== null) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings((prev) => {
          const next = prev + 1;
          setAntiCheatAlert(`Anti-Cheat Warning: Tab change detected (#${next}). Stay on this window during the test.`);
          setTimeout(() => setAntiCheatAlert(null), 4000);
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [result]);

  const handleSubmit = async (isAuto = false) => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch(`/api/v1/quizzes/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Submission failed");
      }
      setResult(data.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleToggleReview = (questionId: string) => {
    setReviewedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const reviewedCount = reviewedQuestionIds.size;

  // ------------------------------------------------------------------
  // RESULT SCREEN
  // ------------------------------------------------------------------
  if (result) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
        {/* Simple Top Bar */}
        <header className="bg-white border-b border-[#E9EDF5] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/REVERSUN LOGO.png" alt="Reversun" width={140} height={35} className="h-7 w-auto object-contain" />
            </Link>
            <Link href="/quizzes" className="text-xs font-bold text-[#FC6235] hover:underline flex items-center gap-1">
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              All Competitions
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
          {/* Performance Card */}
          <div className="bg-white rounded-3xl border border-[#E9EDF5] p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Trophy weight="fill" className="w-8 h-8 text-[#FC6235]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FC6235]">
                Competition Completed
              </span>
              <h1 className="text-3xl font-black text-[#101E35] mt-1">{quizInfo?.title}</h1>
              <p className="text-xs text-[#5C6E87] mt-1">
                Your answers have been graded against authoritative answer keys and points logged to your ledger.
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC6235]/30">
                <div className="text-3xl font-black text-[#FC6235]">{result.totalScore}</div>
                <div className="text-[11px] font-bold text-[#5C6E87] uppercase mt-1">Total Score / {result.maxScore}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-3xl font-black text-emerald-700">{result.accuracyPercentage}%</div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase mt-1">Accuracy</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5]">
                <div className="text-3xl font-black text-[#101E35]">{result.correctCount} / {result.breakdown.length}</div>
                <div className="text-[11px] font-bold text-[#5C6E87] uppercase mt-1">Correct Answers</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5]">
                <div className="text-3xl font-black text-[#1B3360]">{result.completionTimeFormatted}</div>
                <div className="text-[11px] font-bold text-[#5C6E87] uppercase mt-1">Time Elapsed</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#E9EDF5]">
              <Link
                href="/leaderboards"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white text-xs font-bold hover:opacity-95 transition shadow-xs flex items-center gap-1.5"
              >
                <Trophy weight="fill" className="w-4 h-4" />
                View Season Leaderboard
              </Link>
              <Link
                href="/certificates/verify"
                className="px-6 py-2.5 rounded-xl bg-white border border-[#E9EDF5] hover:bg-slate-50 text-[#1B3360] text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
              >
                <Certificate weight="bold" className="w-4 h-4 text-[#FC6235]" />
                Check Certificate Status
              </Link>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-[#101E35]">Detailed Answer Breakdown</h2>
            <div className="space-y-4">
              {result.breakdown.map((item, idx) => (
                <div
                  key={item.questionId}
                  className={`p-4 rounded-2xl border ${
                    item.isCorrect
                      ? "bg-emerald-50/40 border-emerald-200"
                      : item.selectedOptionId
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#5C6E87]">Question {idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                        item.isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : item.selectedOptionId
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.isCorrect ? `Correct (+${item.awardedMarks} pts)` : item.selectedOptionId ? `Incorrect (${item.awardedMarks} pts)` : "Skipped (0 pts)"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#101E35]">{item.questionText}</p>
                  {item.explanation && (
                    <p className="text-[11px] text-slate-600 mt-2 bg-white/70 p-2 rounded-lg border border-slate-200">
                      <strong>Explanation:</strong> {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // LOADING / ERROR SCREEN
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // MANDATORY LOGIN GATE SCREEN
  // ------------------------------------------------------------------
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center px-4 py-12 relative">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E9EDF5] shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF4EF] border border-[#FC6235]/30 text-[#FC6235] flex items-center justify-center mx-auto shadow-xs">
            <LockKey weight="bold" className="w-8 h-8 text-[#FC6235]" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FC6235] bg-[#FFF4EF] px-2.5 py-0.5 rounded-full border border-[#FC6235]/25">
              Identity Verification Required
            </span>
            <h1 className="text-2xl font-black text-[#101E35] mt-2 tracking-tight">
              Sign In to Attempt Competition
            </h1>
            <p className="text-xs text-[#5C6E87] mt-1.5 leading-relaxed">
              Login is mandatory to participate in scheduled competitions. Your attempts, time-scores, and verifiable digital certificates are cryptographically bound to your Google account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full h-13 bg-white hover:bg-slate-50 text-[#1B3360] font-extrabold text-sm rounded-2xl border-2 border-[#E9EDF5] hover:border-[#FC6235]/40 shadow-xs transition flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => loginWithDemoGoogle()}
              className="w-full py-2.5 px-3 bg-[#FFF4EF] hover:bg-[#FFE8DE] text-[#FC6235] font-bold text-xs rounded-xl border border-[#FC6235]/25 transition flex items-center justify-center gap-1.5"
            >
              <Sparkle weight="bold" className="w-3.5 h-3.5" />
              <span>1-Click Test Login as Balaji (Student)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#E9EDF5]">
            <Link
              href="/quizzes"
              className="text-xs font-bold text-[#5C6E87] hover:text-[#FC6235] transition inline-flex items-center gap-1"
            >
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              Return to Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !quizInfo || !currentQ) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#101E35]">
        {error ? (
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 text-center space-y-4 shadow-sm">
            <WarningCircle weight="fill" className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-base font-bold text-red-900">Unable to Start Quiz</h2>
            <p className="text-xs text-slate-600">{error}</p>
            <Link
              href="/quizzes"
              className="inline-block px-5 py-2 rounded-xl bg-[#FC6235] text-white text-xs font-bold"
            >
              Back to Competitions
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
            <p className="text-xs font-bold text-[#5C6E87]">Connecting to secure quiz server...</p>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // ACTIVE TEST PLAYER
  // ------------------------------------------------------------------
  const timerWarning = secondsRemaining !== null && secondsRemaining < 300;
  const timerCritical = secondsRemaining !== null && secondsRemaining < 60;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans select-none">
      {/* Anti-Cheat Floating Banner */}
      {antiCheatAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-black px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <ShieldWarning weight="fill" className="w-5 h-5" />
          <span>{antiCheatAlert}</span>
        </div>
      )}

      {/* Top Test Player Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E9EDF5] px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/REVERSUN LOGO.png" alt="Reversun" width={120} height={30} className="h-6 w-auto object-contain" />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <h1 className="font-extrabold text-xs sm:text-sm text-[#101E35] truncate max-w-[200px] sm:max-w-md">
              {quizInfo.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Synchronized Timer */}
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black transition ${
                timerCritical
                  ? "bg-red-50 text-red-600 border-red-300 animate-pulse"
                  : timerWarning
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-[#FFF4EF] text-[#FC6235] border-[#FC6235]/30"
              }`}
            >
              <Timer weight="bold" className="w-4 h-4" />
              <span>{secondsRemaining !== null ? formatTimer(secondsRemaining) : "--:--"}</span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 transition shadow-2xs"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Question */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-3xl border border-[#E9EDF5] p-6 sm:p-8 shadow-xs space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E9EDF5]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#FC6235] bg-[#FFF4EF] px-2.5 py-1 rounded-lg">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  +{currentQ.marks} Marks
                </span>
                {quizInfo.negativeMarking && currentQ.negativeMarks > 0 && (
                  <span className="text-[11px] font-bold text-rose-500">
                    -{currentQ.negativeMarks} Negative
                  </span>
                )}
              </div>

              <button
                onClick={() => handleToggleReview(currentQ.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  reviewedQuestionIds.has(currentQ.id)
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-white text-slate-500 border-[#E9EDF5] hover:bg-slate-50"
                }`}
              >
                <Flag weight={reviewedQuestionIds.has(currentQ.id) ? "fill" : "bold"} className="w-3.5 h-3.5" />
                <span>{reviewedQuestionIds.has(currentQ.id) ? "Marked for Review" : "Mark Review"}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-sm sm:text-base font-bold text-[#101E35] leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIndex) => {
                const isSelected = answers[currentQ.id] === opt.id;
                const letter = String.fromCharCode(65 + optIndex);

                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-[#FFF4EF] border-[#FC6235] shadow-xs"
                        : "bg-white border-[#E9EDF5] hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                        isSelected
                          ? "bg-[#FC6235] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[#101E35]">
                      {opt.optionText}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Question Action Controls */}
          <div className="flex items-center justify-between gap-3 bg-white border border-[#E9EDF5] rounded-2xl p-4 shadow-xs">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E9EDF5] bg-white text-[#1B3360] hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
              Previous
            </button>

            {answers[currentQ.id] && (
              <button
                onClick={() => handleClearAnswer(currentQ.id)}
                className="text-xs font-bold text-slate-500 hover:text-red-600 transition"
              >
                Clear Choice
              </button>
            )}

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1B3360] text-white hover:bg-[#152749] transition disabled:opacity-40 flex items-center gap-1.5"
            >
              Next
              <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Question Navigator Palette */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#E9EDF5] p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#5C6E87]">
              Question Navigator
            </h2>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#5C6E87] pb-3 border-b border-[#E9EDF5]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span>Review ({reviewedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border border-slate-300 bg-white" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#FC6235]" />
                <span>Current</span>
              </div>
            </div>

            {/* Palette Buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isReviewed = reviewedQuestionIds.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                      isCurrent
                        ? "bg-[#FC6235] text-white ring-2 ring-[#FC6235]/40 shadow-xs"
                        : isReviewed
                        ? "bg-amber-400 text-amber-950"
                        : isAnswered
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-50 text-slate-700 border border-[#E9EDF5] hover:bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E9EDF5] text-center">
            <CheckCircle weight="fill" className="w-12 h-12 text-[#FC6235] mx-auto" />
            <h3 className="text-base font-black text-[#101E35]">Ready to Submit?</h3>
            <p className="text-xs text-[#5C6E87]">
              Once submitted, your answers cannot be altered. Instant grading will be performed.
            </p>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E9EDF5] text-xs">
              <div>
                <div className="font-black text-emerald-600 text-lg">{answeredCount}</div>
                <div className="text-[10px] text-[#5C6E87]">Answered</div>
              </div>
              <div>
                <div className="font-black text-amber-600 text-lg">{reviewedCount}</div>
                <div className="text-[10px] text-[#5C6E87]">Marked</div>
              </div>
              <div>
                <div className="font-black text-slate-400 text-lg">{unansweredCount}</div>
                <div className="text-[10px] text-[#5C6E87]">Unanswered</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-[#E9EDF5] text-slate-600 hover:bg-slate-50"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="w-1/2 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPlayPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#101E35]">
          <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
          <p className="text-xs font-bold text-[#5C6E87] mt-3">Connecting to secure quiz server...</p>
        </div>
      }
    >
      <QuizPlayContent params={props.params} />
    </Suspense>
  );
}

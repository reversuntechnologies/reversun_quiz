"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Lightning,
  PlusCircle,
  MagnifyingGlass,
  CheckCircle,
  CalendarBlank,
  Timer,
  Trash,
  Trophy,
  WarningCircle,
  CaretRight,
  Sparkle,
  Users,
  ArrowSquareOut,
  ListNumbers,
} from "@phosphor-icons/react";
import Link from "next/link";

interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "ARCHIVED";
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  negativeMarking: boolean;
  certificatesEnabled: boolean;
  category: { id: string; name: string; slug: string } | null;
  _count: {
    questions: number;
    registrations: number;
    attempts: number;
    prizes: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function QuizzesTableContent() {
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/admin/quizzes");
      const data = await res.json();
      if (res.ok && data.success) {
        setQuizzes(data.data.quizzes || []);
        setCategories(data.data.categories || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    if (searchParams.get("created") === "true") {
      setToastMessage("New quiz and questions successfully published to database!");
      setTimeout(() => setToastMessage(null), 5000);
    }
  }, [searchParams]);

  const handleStatusChange = async (quizId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/admin/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToastMessage(`Quiz status updated to ${newStatus}`);
        fetchQuizzes();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete quiz "${title}"? This will permanently delete associated questions, attempts, and answer logs.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/quizzes/${quizId}`, { method: "DELETE" });
      if (res.ok) {
        setToastMessage(`Quiz "${title}" deleted successfully`);
        fetchQuizzes();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      alert("Failed to delete quiz");
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.category?.name && q.category.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EDF5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            Quiz & Competition Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] mt-1">
            Author and orchestrate live competitions, manage questions, and inspect candidate answer sheets.
          </p>
        </div>

        <Link
          href="/admin/quizzes/create"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FC6235] hover:bg-[#e05327] text-white transition flex items-center gap-2 shadow-sm shadow-[#FC6235]/25 cursor-pointer shrink-0"
        >
          <PlusCircle weight="bold" className="w-4 h-4" />
          <span>Create New Quiz</span>
        </Link>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            weight="bold"
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or category..."
            className="w-full bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl pl-10 pr-4 py-2 text-xs text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#1B3360] text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-[#E9EDF5]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes List Table */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E9EDF5] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70 text-[11px]">
                <th className="py-3.5 px-6">Quiz Title & Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Difficulty</th>
                <th className="py-3.5 px-4">Duration & Rules</th>
                <th className="py-3.5 px-4">MCQ Questions</th>
                <th className="py-3.5 px-4">Submissions & Attempts</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDF5] font-medium text-[#101E35]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading quizzes from Neon PostgreSQL...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 space-y-3">
                    <Lightning weight="duotone" className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-sm text-[#101E35]">No competitions found.</p>
                    <p className="text-xs text-slate-400">
                      Click &ldquo;Create New Quiz&rdquo; above to author your first competition and questions.
                    </p>
                    <Link
                      href="/admin/quizzes/create"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FC6235] text-white text-xs font-bold shadow-xs hover:bg-[#e05327] transition"
                    >
                      <PlusCircle weight="bold" className="w-4 h-4" />
                      <span>Author Quiz Now</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-[#FFF4EF]/20 transition">
                    <td className="py-4 px-6 max-w-sm">
                      <div className="font-bold text-sm text-[#101E35]">{quiz.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {quiz.category?.name || "General"}
                        </span>
                        <span>•</span>
                        <span>/{quiz.slug}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={quiz.status}
                        onChange={(e) => handleStatusChange(quiz.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                          quiz.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : quiz.status === "DRAFT"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {quiz.difficulty}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      <div>{quiz.durationMinutes} mins</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {quiz.negativeMarking ? "⚠️ -0.25 Negative" : "No Negative Marks"}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <Link
                        href={`/admin/questions?quizId=${quiz.id}`}
                        className="inline-flex items-center gap-1 font-bold text-[#FC6235] hover:underline"
                      >
                        <span>{quiz._count.questions} questions</span>
                        <CaretRight weight="bold" className="w-3 h-3" />
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <Link
                        href={`/admin/quizzes/${quiz.id}/submissions`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-[#1B3360] border border-blue-200 hover:bg-blue-100 font-bold text-[11px] transition"
                        title="View user submissions and individual answer sheets"
                      >
                        <Users weight="bold" className="w-3.5 h-3.5 text-[#1B3360]" />
                        <span>{quiz._count.attempts} attempts</span>
                      </Link>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/quizzes/${quiz.id}/submissions`}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFF4EF] hover:bg-[#FFE5D8] border border-[#FC6235]/30 text-[#FC6235] transition"
                          title="View all candidate submissions and answers"
                        >
                          User Answers
                        </Link>

                        <Link
                          href={`/quizzes/${quiz.slug}/play`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1B3360] hover:bg-slate-100 transition"
                          title="Open public competition view in new tab"
                        >
                          <ArrowSquareOut weight="bold" className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete Quiz"
                        >
                          <Trash weight="bold" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminQuizzesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">Loading quiz management console...</div>
      }
    >
      <QuizzesTableContent />
    </Suspense>
  );
}

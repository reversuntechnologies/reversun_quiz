"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  Sparkle,
  Lightning,
  Question,
  ListNumbers,
  Trash,
  Check,
  ShieldCheck,
} from "@phosphor-icons/react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MCQOption {
  optionText: string;
  isCorrect: boolean;
}

interface QuestionItem {
  questionText: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  options: MCQOption[];
}

export default function CreateQuizPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Quiz Meta State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [description, setDescription] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endsAt, setEndsAt] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  // Number of Questions State
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize questions based on count
  const createEmptyQuestion = (index: number): QuestionItem => ({
    questionText: "",
    marks: 1,
    negativeMarks: 0,
    explanation: "",
    options: [
      { optionText: "", isCorrect: true }, // Option A default correct
      { optionText: "", isCorrect: false }, // Option B
      { optionText: "", isCorrect: false }, // Option C
      { optionText: "", isCorrect: false }, // Option D
    ],
  });

  // Sync questions array when questionCount changes
  useEffect(() => {
    setQuestions((prev) => {
      const targetCount = Math.max(1, questionCount);
      if (prev.length === targetCount) return prev;

      if (prev.length < targetCount) {
        const added: QuestionItem[] = [];
        for (let i = prev.length; i < targetCount; i++) {
          added.push(createEmptyQuestion(i));
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, targetCount);
      }
    });
  }, [questionCount]);

  // Load available categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/v1/admin/quizzes");
        const data = await res.json();
        if (data.success && data.data.categories) {
          setCategories(data.data.categories);
          if (data.data.categories.length > 0) {
            setCategoryId(data.data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleOptionTextChange = (
    qIndex: number,
    optIndex: number,
    text: string
  ) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const options = [...q.options];
      options[optIndex] = { ...options[optIndex], optionText: text };
      q.options = options;
      next[qIndex] = q;
      return next;
    });
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      q.options = q.options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === optIndex,
      }));
      next[qIndex] = q;
      return next;
    });
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], questionText: text };
      return next;
    });
  };

  const handleMarksChange = (qIndex: number, marks: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], marks };
      return next;
    });
  };

  const handleExplanationChange = (qIndex: number, exp: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], explanation: exp };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Please enter a competition title.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (questions.length === 0) {
      setFormError("Please configure at least one question.");
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setFormError(`Question #${i + 1} has an empty question statement.`);
        return;
      }

      const filledOptions = q.options.filter((o) => o.optionText.trim().length > 0);
      if (filledOptions.length < 2) {
        setFormError(
          `Question #${i + 1} requires at least 2 non-empty options (ideally all 4).`
        );
        return;
      }

      const hasCorrect = q.options.some((o) => o.isCorrect && o.optionText.trim().length > 0);
      if (!hasCorrect) {
        setFormError(
          `Question #${i + 1} does not have a valid correct answer option selected.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          categoryId: categoryId || undefined,
          difficulty,
          durationMinutes: Number(durationMinutes) || 20,
          description: description.trim() || undefined,
          negativeMarking,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          status: "PUBLISHED",
          questions: questions.map((q) => ({
            questionText: q.questionText.trim(),
            marks: Number(q.marks) || 1,
            negativeMarks: negativeMarking ? 0.25 : 0,
            explanation: q.explanation?.trim() || null,
            type: "SINGLE",
            options: q.options
              .filter((o) => o.optionText.trim().length > 0)
              .map((o) => ({
                optionText: o.optionText.trim(),
                isCorrect: o.isCorrect,
              })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create quiz");
      }

      // Success -> navigate to quizzes list
      router.push("/admin/quizzes?created=true");
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred while saving the quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Title */}
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
            <span className="text-[#101E35]">Author New Quiz</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            Create Quiz & Author Questions
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] mt-1">
            Specify quiz rules, set the question count, and fill out MCQ options with answer keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes"
            className="px-4 py-2.5 rounded-xl border border-[#E9EDF5] bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#FC6235] hover:bg-[#e05327] text-white text-xs font-bold transition shadow-sm shadow-[#FC6235]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle weight="bold" className="w-4 h-4" />
            )}
            <span>{isSubmitting ? "Saving to Database..." : "Publish Quiz to Database"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold flex items-center gap-2 animate-in fade-in">
          <WarningCircle weight="fill" className="w-5 h-5 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: QUIZ CORE DETAILS */}
        <div className="bg-white rounded-3xl border border-[#E9EDF5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E9EDF5]">
            <Lightning weight="duotone" className="w-5 h-5 text-[#FC6235]" />
            <h2 className="text-base font-extrabold text-[#101E35]">
              Step 1: Quiz Details & Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-[#101E35] mb-1.5">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next.js 16 Systems & Server Actions Challenge"
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isLoadingCategories}
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition cursor-pointer"
              >
                <option value="EASY">EASY (Beginner friendly)</option>
                <option value="MEDIUM">MEDIUM (Standard competition)</option>
                <option value="HARD">HARD (Advanced engineering)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">
                Duration (Minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={180}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">Negative Marking</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setNegativeMarking(!negativeMarking)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    negativeMarking ? "bg-[#FC6235]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      negativeMarking ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs text-slate-600 font-medium">
                  {negativeMarking
                    ? "Enabled (-0.25 marks per incorrect response)"
                    : "Disabled (No negative marks)"}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">Competition Starts At</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-[#101E35] mb-1.5">Competition Ends At</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#101E35] mb-1.5">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief summary of topics covered in this quiz..."
                className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CHOOSE NUMBER OF QUESTIONS */}
        <div className="bg-white rounded-3xl border-2 border-[#FC6235]/30 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E9EDF5]">
            <div className="flex items-center gap-2">
              <ListNumbers weight="bold" className="w-5 h-5 text-[#FC6235]" />
              <div>
                <h2 className="text-base font-extrabold text-[#101E35]">
                  Step 2: Choose Number of Questions
                </h2>
                <p className="text-xs text-[#5C6E87]">
                  The exact number of MCQ question adding fields will dynamically generate below.
                </p>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    questionCount === num
                      ? "bg-[#1B3360] text-white shadow-xs"
                      : "bg-[#FAF9F6] text-slate-700 border border-[#E9EDF5] hover:bg-slate-100"
                  }`}
                >
                  {num} {num === 1 ? "Question" : "Questions"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="font-bold text-[#101E35] whitespace-nowrap">
              Selected Question Count:
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 p-2.5 bg-[#FAF9F6] border-2 border-[#FC6235]/40 rounded-xl text-sm font-black text-[#FC6235] text-center focus:outline-none focus:border-[#FC6235] focus:bg-white"
            />
            <span className="text-slate-500">
              Generating <strong>{questions.length}</strong> MCQ authoring card{questions.length !== 1 ? "s" : ""}.
            </span>
          </div>
        </div>

        {/* SECTION 3: DYNAMIC MCQ QUESTION FIELDS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Question weight="bold" className="w-5 h-5 text-[#FC6235]" />
              <h2 className="text-base font-extrabold text-[#101E35]">
                Step 3: Question & Answer Authoring ({questions.length} Questions)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Select the radio button beside the correct option to mark the answer key.
            </span>
          </div>

          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="bg-white rounded-3xl border border-[#E9EDF5] p-6 sm:p-7 shadow-xs space-y-5 transition hover:border-slate-300"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E9EDF5]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#FFF4EF] text-[#FC6235] font-black text-xs flex items-center justify-center border border-[#FC6235]/30">
                    #{qIdx + 1}
                  </span>
                  <span className="font-bold text-sm text-[#101E35]">
                    Question Statement {qIdx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={q.marks}
                      onChange={(e) => handleMarksChange(qIdx, Number(e.target.value))}
                      className="w-14 p-1 bg-[#FAF9F6] border border-[#E9EDF5] rounded-lg text-center font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Question Prompt */}
              <div>
                <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                  Question Text / Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={q.questionText}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  placeholder={`Enter question #${qIdx + 1} statement clearly...`}
                  className="w-full p-3 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs font-semibold text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white transition"
                />
              </div>

              {/* 4 MCQ Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#101E35]">
                  Multiple Choice Options (4 Choices) • Select the Correct Option
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = opt.isCorrect;
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                          isSelected
                            ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20"
                            : "bg-[#FAF9F6] border-[#E9EDF5] hover:bg-slate-50"
                        }`}
                      >
                        {/* Radio Selector */}
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border-2 border-slate-300 hover:border-emerald-500 bg-white"
                          }`}
                          title="Set as correct answer"
                        >
                          {isSelected && <Check weight="bold" className="w-3.5 h-3.5" />}
                        </button>

                        <span className="w-5 font-black text-xs text-slate-400">
                          {optionLetters[optIdx]}.
                        </span>

                        <input
                          type="text"
                          required
                          value={opt.optionText}
                          onChange={(e) =>
                            handleOptionTextChange(qIdx, optIdx, e.target.value)
                          }
                          placeholder={`Option ${optionLetters[optIdx]} text...`}
                          className="flex-1 bg-transparent border-0 text-xs font-semibold text-[#101E35] focus:outline-none placeholder:text-slate-400"
                        />

                        {isSelected && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                            Correct Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Explanation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Answer Explanation / Solution Reference (Optional)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                  placeholder="Explain why this answer is correct for the participant review sheet..."
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#FC6235] focus:bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="text-xs text-slate-600">
            Authoring <strong className="text-[#101E35]">{questions.length}</strong> MCQ questions.
            All answers will be saved in Neon PostgreSQL.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/admin/quizzes"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl border border-[#E9EDF5] bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#FC6235] hover:bg-[#e05327] text-white text-xs font-bold transition shadow-sm shadow-[#FC6235]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle weight="bold" className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "Saving to Database..." : "Publish Quiz to Database"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

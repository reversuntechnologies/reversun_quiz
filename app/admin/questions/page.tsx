"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Question,
  PlusCircle,
  UploadSimple,
  Trash,
  CheckCircle,
  FileCsv,
  FileCode,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";

interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
}

interface QuestionItem {
  id: string;
  questionText: string;
  type: "SINGLE" | "MULTIPLE";
  marks: number;
  negativeMarks: number;
  explanation: string | null;
  position: number;
  options: QuestionOption[];
}

interface QuizOption {
  id: string;
  title: string;
  slug: string;
}

function AdminQuestionsContent() {
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId") || "";

  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Question Modal
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"SINGLE" | "MULTIPLE">("SINGLE");
  const [marks, setMarks] = useState("4");
  const [negativeMarks, setNegativeMarks] = useState("1");
  const [explanation, setExplanation] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOpt, setCorrectOpt] = useState<"A" | "B" | "C" | "D">("A");

  // Bulk Import Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [isImporting, setIsImporting] = useState(false);

  // 1. Fetch available quizzes list
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await fetch("/api/v1/admin/quizzes");
        const data = await res.json();
        if (res.ok && data.success && data.data.quizzes) {
          setQuizzes(data.data.quizzes);
          if (!selectedQuizId && data.data.quizzes.length > 0) {
            setSelectedQuizId(data.data.quizzes[0].id);
          }
        }
      } catch {
        // ignore
      }
    }
    loadQuizzes();
  }, [selectedQuizId]);

  // 2. Fetch questions for selected quiz
  const fetchQuestions = async (quizId: string) => {
    if (!quizId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/questions?quizId=${quizId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions(data.data || []);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      fetchQuestions(selectedQuizId);
    }
  }, [selectedQuizId]);

  // 3. Add Single Question
  const handleAddSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optA.trim() || !optB.trim()) {
      alert("Question text and at least 2 options are required.");
      return;
    }

    try {
      const options = [
        { optionText: optA.trim(), isCorrect: correctOpt === "A" },
        { optionText: optB.trim(), isCorrect: correctOpt === "B" },
      ];
      if (optC.trim()) options.push({ optionText: optC.trim(), isCorrect: correctOpt === "C" });
      if (optD.trim()) options.push({ optionText: optD.trim(), isCorrect: correctOpt === "D" });

      const res = await fetch("/api/v1/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: selectedQuizId,
          questionText: questionText.trim(),
          type: questionType,
          marks: Number(marks) || 1,
          negativeMarks: Number(negativeMarks) || 0,
          explanation: explanation.trim() || undefined,
          options,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage("Question added successfully!");
        setIsSingleModalOpen(false);
        setQuestionText("");
        setExplanation("");
        setOptA("");
        setOptB("");
        setOptC("");
        setOptD("");
        fetchQuestions(selectedQuizId);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(data.message || "Failed to add question");
      }
    } catch {
      alert("Error creating question");
    }
  };

  // 4. Bulk Import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    setIsImporting(true);
    try {
      let body: any = { quizId: selectedQuizId };
      if (importFormat === "csv") {
        body.csvContent = bulkInput.trim();
      } else {
        body.questions = JSON.parse(bulkInput.trim());
      }

      const res = await fetch("/api/v1/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(data.message || "Bulk import complete!");
        setIsBulkModalOpen(false);
        setBulkInput("");
        fetchQuestions(selectedQuizId);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.message || "Bulk import failed. Please verify formatting.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to parse input");
    } finally {
      setIsImporting(false);
    }
  };

  // Sample CSV filler for instant preview
  const fillSampleCsv = () => {
    setImportFormat("csv");
    setBulkInput(
      `Question Text,Type,Marks,Negative Marks,Explanation,Option A,Option B,Option C,Option D,Correct Option\n` +
      `"What is the time complexity of searching an element in a balanced B-Tree?",SINGLE,4,1,"B-Tree search is logarithmic with respect to height.","O(log n)","O(n)","O(1)","O(n log n)",A\n` +
      `"Which PostgreSQL command physically reclaims storage space occupied by dead tuples?",SINGLE,4,1,"VACUUM FULL rewrites the table file to reclaim disk space.","VACUUM FULL","REINDEX TABLE","ANALYZE","TRUNCATE",A\n` +
      `"In React 19, what hook is used to access form action state asynchronously?",SINGLE,4,1,"useActionState manages asynchronous form action status.","useActionState","useFormStatus","useTransition","useEffect",A`
    );
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/v1/admin/questions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToastMessage("Question deleted");
        fetchQuestions(selectedQuizId);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      alert("Failed to delete question");
    }
  };

  const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9EDF5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">Question Bank & Bulk Importer</h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] mt-1">
            Manage question options, scoring rules, and bulk import hundreds of questions via CSV/JSON.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSingleModalOpen(true)}
            disabled={!selectedQuizId}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1B3360] hover:bg-[#152749] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <PlusCircle weight="bold" className="w-4 h-4 text-[#FC6235]" />
            Add Single Question
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!selectedQuizId}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FC6235] hover:bg-[#e05327] text-white transition flex items-center gap-1.5 shadow-sm shadow-[#FC6235]/25 cursor-pointer disabled:opacity-50"
          >
            <UploadSimple weight="bold" className="w-4 h-4" />
            Bulk CSV / JSON Import
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Target Quiz Selector Banner */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF4EF] flex items-center justify-center text-[#FC6235]">
            <Question weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Target Quiz
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="mt-1 font-bold text-sm text-[#101E35] bg-transparent border-b border-[#FC6235] focus:outline-none pr-6 cursor-pointer"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-[#101E35] block">
            {questions.length} Questions Loaded
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Total Marks: {questions.reduce((acc, q) => acc + Number(q.marks), 0)} pts
          </span>
        </div>
      </div>

      {/* Questions Feed / List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 bg-white border border-[#E9EDF5] rounded-3xl">
            Loading questions from database...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E9EDF5] rounded-3xl p-8 space-y-3">
            <Question weight="duotone" className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-base text-[#101E35]">No Questions Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This quiz does not have any questions. Add single questions manually or use our high-speed bulk CSV/JSON importer.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsSingleModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#101E35] text-xs font-bold rounded-xl cursor-pointer"
              >
                Add Manually
              </button>
              <button
                onClick={() => {
                  setIsBulkModalOpen(true);
                  fillSampleCsv();
                }}
                className="px-4 py-2 bg-[#FC6235] hover:bg-[#e05327] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkle weight="fill" className="w-3.5 h-3.5" />
                Try Sample Bulk Import
              </button>
            </div>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white border border-[#E9EDF5] rounded-2xl p-5 shadow-xs space-y-3 hover:border-[#FC6235]/40 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FAF9F6] border border-[#E9EDF5] font-bold text-xs flex items-center justify-center text-[#1B3360] shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#101E35] leading-snug">
                      {q.questionText}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold">
                        +{q.marks} Marks
                      </span>
                      {Number(q.negativeMarks) > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded font-bold">
                          -{q.negativeMarks} Negative
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 uppercase font-mono text-[10px] font-bold">
                        {q.type} CHOICE
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition"
                  title="Delete Question"
                >
                  <Trash weight="bold" className="w-4 h-4" />
                </button>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      opt.isCorrect
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold"
                        : "bg-[#FAF9F6] border-[#E9EDF5] text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-[10px] flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt.optionText}</span>
                    </div>
                    {opt.isCorrect && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation Note */}
              {q.explanation && (
                <div className="pt-2 text-[11px] text-slate-500 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E9EDF5]">
                  <strong className="text-slate-700">Explanation: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SINGLE QUESTION MODAL */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9EDF5]">
              <h3 className="font-extrabold text-base text-[#101E35]">Add Question to Quiz</h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingleQuestion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#101E35] mb-1">Question Statement *</label>
                <textarea
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which PostgreSQL index type is most suitable for range queries and spatial data?"
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#101E35] mb-1">Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl font-medium"
                  >
                    <option value="SINGLE">Single Choice</option>
                    <option value="MULTIPLE">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#101E35] mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#101E35] mb-1">Negative (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E9EDF5]">
                <label className="block font-bold text-[#101E35]">Options & Correct Answer</label>
                <div className="space-y-2">
                  {[
                    { key: "A", val: optA, set: setOptA },
                    { key: "B", val: optB, set: setOptB },
                    { key: "C", val: optC, set: setOptC },
                    { key: "D", val: optD, set: setOptD },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={correctOpt === item.key}
                        onChange={() => setCorrectOpt(item.key as any)}
                        className="text-[#FC6235] focus:ring-[#FC6235]"
                      />
                      <span className="font-bold w-4 text-center">{item.key}:</span>
                      <input
                        type="text"
                        value={item.val}
                        onChange={(e) => item.set(e.target.value)}
                        placeholder={`Option ${item.key} text`}
                        className="flex-1 p-2 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#101E35] mb-1">Explanation (Shown after quiz)</label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Optional brief explanation of the correct answer..."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9EDF5]">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FC6235] hover:bg-[#e05327] text-white shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV / JSON MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9EDF5]">
              <div className="flex items-center gap-2">
                <UploadSimple weight="bold" className="w-5 h-5 text-[#FC6235]" />
                <h3 className="font-extrabold text-base text-[#101E35]">Bulk Question Importer</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportFormat("csv")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    importFormat === "csv" ? "bg-[#1B3360] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <FileCsv weight="bold" className="w-4 h-4" />
                  CSV Format
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat("json")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    importFormat === "json" ? "bg-[#1B3360] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <FileCode weight="bold" className="w-4 h-4" />
                  JSON Format
                </button>
              </div>

              <button
                type="button"
                onClick={fillSampleCsv}
                className="text-xs text-[#FC6235] hover:underline font-bold flex items-center gap-1"
              >
                <Sparkle weight="fill" className="w-3.5 h-3.5" />
                Load Sample Template
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#101E35] mb-1">
                  Paste {importFormat.toUpperCase()} Data
                </label>
                <textarea
                  required
                  rows={9}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={
                    importFormat === "csv"
                      ? "Question Text,Type,Marks,Negative Marks,Explanation,Option A,Option B,Option C,Option D,Correct Option"
                      : '[{ "questionText": "...", "marks": 4, "options": [{ "optionText": "...", "isCorrect": true }] }]'
                  }
                  className="w-full p-3 font-mono text-[11px] bg-[#FAF9F6] border border-[#E9EDF5] rounded-2xl text-[#101E35] focus:outline-none focus:border-[#FC6235] focus:bg-white leading-relaxed"
                />
              </div>

              <div className="p-3 bg-[#FFF4EF] border border-[#FC6235]/25 rounded-xl text-[11px] text-[#101E35]">
                Target Quiz: <strong>{currentQuiz?.title || "Selected Quiz"}</strong>. All parsed questions will be validated against Zod schema and inserted sequentially into Neon PostgreSQL.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9EDF5]">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FC6235] hover:bg-[#e05327] text-white shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? "Processing & Inserting..." : "Execute Bulk Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-semibold text-[#5C6E87]">
          Loading question bank...
        </div>
      }
    >
      <AdminQuestionsContent />
    </Suspense>
  );
}

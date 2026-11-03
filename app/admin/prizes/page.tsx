"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Trophy,
  Plus,
  Trash,
  PencilSimple,
  Medal,
  Gift,
  Coins,
  CheckCircle,
  CircleNotch,
  Sparkle,
} from "@phosphor-icons/react";

interface PrizeRecord {
  id: string;
  quizId: string;
  position: number;
  title: string;
  description: string | null;
  rewardType: string;
  rewardValue: number | null;
  rewardCurrency: string | null;
  quiz?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
}

interface QuizOption {
  id: string;
  title: string;
}

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<PrizeRecord[]>([]);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formQuizId, setFormQuizId] = useState("");
  const [formPosition, setFormPosition] = useState(1);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRewardType, setFormRewardType] = useState("CASH");
  const [formRewardValue, setFormRewardValue] = useState("");
  const [formCurrency, setFormCurrency] = useState("INR");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prizesRes, quizzesRes] = await Promise.all([
        fetch("/api/v1/admin/prizes"),
        fetch("/api/v1/admin/quizzes"),
      ]);

      const prizesData = await prizesRes.json();
      const quizzesData = await quizzesRes.json();

      if (prizesData.success) {
        setPrizes(prizesData.data.prizes || []);
      }
      if (quizzesData.success) {
        setQuizzes(quizzesData.data.quizzes || []);
        if (quizzesData.data.quizzes?.length > 0 && !formQuizId) {
          setFormQuizId(quizzesData.data.quizzes[0].id);
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching prizes", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuizId || !formTitle) {
      alert("Please choose a quiz and enter a prize title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: formQuizId,
          position: Number(formPosition),
          title: formTitle,
          description: formDescription,
          rewardType: formRewardType,
          rewardValue: formRewardValue ? Number(formRewardValue) : null,
          rewardCurrency: formCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save prize");
      }

      showToast("Prize configured successfully!");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving prize");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm("Are you sure you want to remove this prize allocation?")) return;
    try {
      const res = await fetch(`/api/v1/admin/prizes?id=${prizeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete prize");
      }
      showToast("Prize removed");
      setPrizes((prev) => prev.filter((p) => p.id !== prizeId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const resetForm = () => {
    setFormPosition(1);
    setFormTitle("");
    setFormDescription("");
    setFormRewardType("CASH");
    setFormRewardValue("");
  };

  const filteredPrizes = useMemo(() => {
    if (selectedQuizId === "ALL") return prizes;
    return prizes.filter((p) => p.quizId === selectedQuizId);
  }, [prizes, selectedQuizId]);

  const totalPrizePool = useMemo(() => {
    return filteredPrizes.reduce((sum, p) => sum + (Number(p.rewardValue) || 0), 0);
  }, [filteredPrizes]);

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
            <Trophy weight="duotone" className="w-4 h-4" />
            <span>Reward Matrix & Incentives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            Prize Management
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1">
            Configure cash awards, runner-up vouchers, and certificates per competition podium rank.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FC6235] to-[#FF5D37] text-white hover:opacity-95 transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus weight="bold" className="w-4 h-4" />
          Add Prize Tier
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Select Competition</span>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="mt-2 text-xs font-bold px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] focus:outline-hidden"
          >
            <option value="ALL">All Competitions ({prizes.length} prizes)</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <span className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Prize Pool Sum</span>
          <div className="text-2xl font-black text-[#FC6235] mt-1">
            ₹{totalPrizePool.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Calculated across selected filters</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <span className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Configured Tiers</span>
          <div className="text-2xl font-black text-[#1B3360] mt-1">
            {filteredPrizes.length} Positions
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Podium & Merit award tiers</div>
        </div>
      </div>

      {/* Podium Visual Cards */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#101E35] flex items-center gap-2">
          <Sparkle weight="fill" className="w-4 h-4 text-[#FC6235]" />
          Podium Prize Allocations
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-[#5C6E87] flex flex-col items-center justify-center gap-2">
            <CircleNotch weight="bold" className="w-6 h-6 animate-spin text-[#FC6235]" />
            <span className="text-xs font-semibold">Loading prize allocations...</span>
          </div>
        ) : filteredPrizes.length === 0 ? (
          <div className="p-12 text-center text-[#5C6E87] bg-[#FAF9F6] rounded-xl border border-dashed border-[#E9EDF5]">
            <Trophy weight="duotone" className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No prizes configured for this selection.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Add Prize Tier" above to define rewards.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPrizes.map((prize) => {
              const isGold = prize.position === 1;
              const isSilver = prize.position === 2;
              const isBronze = prize.position === 3;

              return (
                <div
                  key={prize.id}
                  className={`p-5 rounded-2xl border transition relative flex flex-col justify-between gap-4 ${
                    isGold
                      ? "bg-gradient-to-b from-amber-50/70 to-white border-amber-200 shadow-sm"
                      : isSilver
                      ? "bg-gradient-to-b from-slate-50 to-white border-slate-300 shadow-xs"
                      : isBronze
                      ? "bg-gradient-to-b from-orange-50/50 to-white border-orange-200 shadow-xs"
                      : "bg-white border-[#E9EDF5]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            isGold
                              ? "bg-amber-400 text-amber-950"
                              : isSilver
                              ? "bg-slate-300 text-slate-800"
                              : isBronze
                              ? "bg-amber-700 text-amber-100"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          #{prize.position}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {isGold ? "Gold Medalist" : isSilver ? "Silver Medalist" : isBronze ? "Bronze Medalist" : "Rank Tier"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeletePrize(prize.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Prize"
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-sm text-[#101E35] mt-1">{prize.title}</h3>
                    {prize.description && (
                      <p className="text-xs text-[#5C6E87] mt-1 leading-relaxed">{prize.description}</p>
                    )}
                    {prize.quiz && (
                      <div className="text-[11px] font-semibold text-[#1B3360] mt-2 bg-white/70 px-2 py-0.5 rounded-md inline-block border border-slate-200">
                        {prize.quiz.title}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {prize.rewardType}
                    </span>
                    <span className="text-lg font-black text-[#FC6235]">
                      {prize.rewardValue ? `₹${Number(prize.rewardValue).toLocaleString()}` : "Honorary"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Prize Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E9EDF5]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101E35] flex items-center gap-2">
                <Trophy weight="fill" className="w-5 h-5 text-[#FC6235]" />
                Configure Prize Tier
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#101E35] block mb-1">Target Competition</label>
                <select
                  value={formQuizId}
                  onChange={(e) => setFormQuizId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] font-semibold focus:outline-hidden"
                  required
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#101E35] block mb-1">Position / Rank</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formPosition}
                    onChange={(e) => setFormPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101E35] block mb-1">Reward Type</label>
                  <select
                    value={formRewardType}
                    onChange={(e) => setFormRewardType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] font-semibold"
                  >
                    <option value="CASH">Cash Transfer</option>
                    <option value="VOUCHER">Shopping Voucher</option>
                    <option value="MERCHANDISE">Merchandise</option>
                    <option value="CERTIFICATE">Certificate Only</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#101E35] block mb-1">Prize Title</label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,000 Cash Prize + Winner Trophy"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#101E35] block mb-1">Estimated Value (₹ INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formRewardValue}
                  onChange={(e) => setFormRewardValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35]"
                />
              </div>

              <div>
                <label className="font-bold text-[#101E35] block mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched via UPI to registered mobile number within 24 hours of quiz finalization."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold rounded-xl border border-[#E9EDF5] text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-bold rounded-xl bg-[#FC6235] text-white hover:bg-[#e05027] transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Prize Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

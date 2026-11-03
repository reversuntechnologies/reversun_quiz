"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import {
  User as UserIcon,
  Trophy,
  Certificate,
  Coins,
  CalendarBlank,
  CheckCircle,
  Lightning,
  ShieldCheck,
  ArrowsClockwise,
  ArrowSquareOut,
  PencilSimple,
  Medal,
  LockKey,
  Phone,
  EnvelopeSimple,
  IdentificationBadge,
  Sparkle,
  CircleNotch,
  FloppyDisk,
} from "@phosphor-icons/react";
import { useUserAuth } from "@/context/UserAuthContext";

interface CertificateItem {
  id: string;
  certificateNumber: string;
  verificationToken: string;
  type: string;
  position: number | null;
  score: number | null;
  issuedAt: string;
  quizTitle: string;
}

interface AttemptItem {
  id: string;
  quizTitle: string;
  totalScore: number;
  maxScore: number;
  status: string;
  submittedAt: string;
}

interface PointItem {
  id: string;
  points: number;
  source: string;
  description: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, token, isLoading: authLoading, loginWithGoogle, loginWithDemoGoogle, refreshProfile } = useUserAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "history" | "certificates" | "ledger">("personal");

  // Personal Info Form State
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number | string>("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Stats & Records
  const [totalPoints, setTotalPoints] = useState(420);
  const [quizzesAttended, setQuizzesAttended] = useState(6);
  const [certificates, setCertificates] = useState<CertificateItem[]>([
    {
      id: "c-1",
      certificateNumber: "REV-2026-CERT-0001",
      verificationToken: "token-ai-frontier-2026",
      type: "WINNER",
      position: 1,
      score: 95,
      issuedAt: "2026-11-02T10:00:00Z",
      quizTitle: "REVERSUN AI Frontier Challenge 2026",
    },
    {
      id: "c-2",
      certificateNumber: "REV-2026-CERT-0002",
      verificationToken: "token-fullstack-2026",
      type: "PARTICIPATION",
      position: 5,
      score: 82,
      issuedAt: "2026-10-28T18:30:00Z",
      quizTitle: "Full-Stack System Design Sprint",
    },
  ]);
  const [attempts, setAttempts] = useState<AttemptItem[]>([
    {
      id: "att-1",
      quizTitle: "REVERSUN AI Frontier Challenge 2026",
      totalScore: 95,
      maxScore: 100,
      status: "SUBMITTED",
      submittedAt: "2026-11-02T10:35:00Z",
    },
    {
      id: "att-2",
      quizTitle: "Full-Stack System Design Sprint",
      totalScore: 82,
      maxScore: 100,
      status: "SUBMITTED",
      submittedAt: "2026-10-28T19:00:00Z",
    },
    {
      id: "att-3",
      quizTitle: "Autumn Algorithm Championship",
      totalScore: 78,
      maxScore: 100,
      status: "SUBMITTED",
      submittedAt: "2026-10-15T15:20:00Z",
    },
  ]);
  const [pointTransactions, setPointTransactions] = useState<PointItem[]>([
    {
      id: "pt-1",
      points: 100,
      source: "QUIZ_RANK_1",
      description: "Winner Rank 1 in REVERSUN AI Frontier Challenge",
      createdAt: "2026-11-02T11:00:00Z",
    },
    {
      id: "pt-2",
      points: 25,
      source: "QUIZ_TOP_10",
      description: "Top 10 Finish in Full-Stack System Design Sprint",
      createdAt: "2026-10-28T19:30:00Z",
    },
    {
      id: "pt-3",
      points: 10,
      source: "QUIZ_PARTICIPATION",
      description: "Participated in Autumn Algorithm Championship",
      createdAt: "2026-10-15T15:25:00Z",
    },
  ]);

  // Sync inputs with active user profile
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setDisplayName(user.displayName || user.name || "");
      setAge(user.age || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
    }
  }, [user]);

  // Fetch live stats from API if authenticated
  useEffect(() => {
    async function loadStats() {
      if (!user || !token) return;
      try {
        const res = await fetch("/api/v1/users/me/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.totalPoints !== undefined) setTotalPoints(data.data.totalPoints);
          if (data.data.quizzesAttended !== undefined) setQuizzesAttended(data.data.quizzesAttended);
        }
      } catch (err) {
        console.warn("Could not load stats", err);
      }
    }
    loadStats();
  }, [user, token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (token) {
        const res = await fetch("/api/v1/users/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            displayName,
            age: age ? Number(age) : null,
            phone: phone || null,
            bio: bio || null,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update profile");
        }
      }

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* If user is not logged in, display the mandatory Google Login Gate */}
        {!authLoading && !user && (
          <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-[#E9EDF5] shadow-xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4EF] border border-[#FC6235]/30 text-[#FC6235] flex items-center justify-center mx-auto shadow-xs">
              <LockKey weight="bold" className="w-8 h-8 text-[#FC6235]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FC6235] bg-[#FFF4EF] px-2.5 py-0.5 rounded-full border border-[#FC6235]/25">
                Authentication Required
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101E35] mt-3">
                Sign In to View Your Profile
              </h1>
              <p className="text-xs text-[#5C6E87] mt-2 max-w-md mx-auto leading-relaxed">
                Your personal profile, competition submission history, points ledger, and verified certificates are tied to your Google identity.
              </p>
            </div>

            <div className="space-y-3 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full h-13 bg-white hover:bg-slate-50 text-[#1B3360] font-extrabold text-sm rounded-2xl border-2 border-[#E9EDF5] hover:border-[#FC6235]/40 shadow-xs transition flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer"
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
              <Link href="/quizzes" className="text-xs font-bold text-[#FC6235] hover:underline">
                Explore Available Competitions &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated User View */}
        {user && (
          <>
            {/* Profile Header Card */}
            <div className="bg-white rounded-3xl border border-[#E9EDF5] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#1B3360] to-[#2B4B8A] text-white flex items-center justify-center font-black text-2xl shadow-md">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[#101E35]">
                      {user.displayName || user.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Google Competitor
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6E87]">{user.email}</p>
                  <div className="flex items-center gap-2 text-[11px] text-[#FC6235] font-bold">
                    <span>Participant ID: {user.id ? user.id.slice(0, 8) : "Registered"}</span>
                    <span>•</span>
                    <span>Active Member</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/quizzes"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#FC6235] to-[#FF5D37] shadow-sm shadow-[#FC6235]/25 flex items-center gap-1.5"
                >
                  <Lightning weight="bold" className="w-3.5 h-3.5" />
                  <span>Enter Live Quiz</span>
                </Link>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
                <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider flex items-center gap-1.5">
                  <Coins weight="bold" className="w-4 h-4 text-[#FC6235]" />
                  <span>Total Points</span>
                </div>
                <div className="text-3xl font-black text-[#FC6235] mt-1">
                  {totalPoints.toLocaleString()} pts
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
                <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy weight="bold" className="w-4 h-4 text-amber-500" />
                  <span>Standing</span>
                </div>
                <div className="text-3xl font-black text-[#1B3360] mt-1">
                  #1 Podium
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
                <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider flex items-center gap-1.5">
                  <Lightning weight="bold" className="w-4 h-4 text-emerald-600" />
                  <span>Quizzes Attempted</span>
                </div>
                <div className="text-3xl font-black text-[#101E35] mt-1">
                  {quizzesAttended}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
                <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider flex items-center gap-1.5">
                  <Certificate weight="bold" className="w-4 h-4 text-[#FC6235]" />
                  <span>Certificates</span>
                </div>
                <div className="text-3xl font-black text-[#101E35] mt-1">
                  {certificates.length}
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E9EDF5] pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === "personal"
                    ? "bg-[#1B3360] text-white shadow-xs"
                    : "text-[#5C6E87] hover:text-[#101E35] hover:bg-slate-100"
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab("certificates")}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === "certificates"
                    ? "bg-[#1B3360] text-white shadow-xs"
                    : "text-[#5C6E87] hover:text-[#101E35] hover:bg-slate-100"
                }`}
              >
                Digital Certificates ({certificates.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === "history"
                    ? "bg-[#1B3360] text-white shadow-xs"
                    : "text-[#5C6E87] hover:text-[#101E35] hover:bg-slate-100"
                }`}
              >
                Quiz Attempts History
              </button>
              <button
                onClick={() => setActiveTab("ledger")}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === "ledger"
                    ? "bg-[#1B3360] text-white shadow-xs"
                    : "text-[#5C6E87] hover:text-[#101E35] hover:bg-slate-100"
                }`}
              >
                Points Ledger
              </button>
            </div>

            {/* Tab 1: Personal Information Form */}
            {activeTab === "personal" && (
              <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xs p-6 sm:p-8">
                <div className="max-w-2xl">
                  <div className="mb-6">
                    <h2 className="text-base font-black text-[#101E35]">
                      Candidate Personal Details
                    </h2>
                    <p className="text-xs text-[#5C6E87] mt-1">
                      This information appears on your officially issued digital certificates and competition leaderboards.
                    </p>
                  </div>

                  {saveSuccess && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle weight="fill" className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Personal information saved successfully!</span>
                    </div>
                  )}

                  {saveError && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {saveError}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Full Name (Legal Name for Certificates)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-xs font-bold text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Display / Leaderboard Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-xs font-bold text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Email Address (Google Account)
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-slate-100 text-xs font-bold text-slate-500 cursor-not-allowed"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Verified through Google OAuth
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-xs font-bold text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Age / Academic Standard
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 21"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-xs font-bold text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                          Bio / Student Summary
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Computer Science Student at Anna University"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-xs font-bold text-[#101E35] focus:outline-hidden focus:border-[#FC6235]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-[#1B3360] hover:bg-[#23437D] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <FloppyDisk weight="bold" className="w-4 h-4" />
                            <span>Save Personal Information</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 2: Digital Certificates */}
            {activeTab === "certificates" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-xs relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FC6235]/10 to-transparent rounded-bl-full pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#FFF4EF] text-[#FC6235] border border-[#FC6235]/30">
                          {cert.type} CERTIFICATE
                        </span>
                        <span className="text-[11px] font-mono text-[#5C6E87]">
                          {cert.certificateNumber}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-[#101E35] mt-4 leading-snug">
                        {cert.quizTitle}
                      </h3>
                      <p className="text-xs text-[#5C6E87] mt-1">
                        Issued on {new Date(cert.issuedAt).toLocaleDateString()} to{" "}
                        <strong className="text-[#101E35]">{user.name}</strong>
                      </p>

                      <div className="mt-4 flex items-center gap-4 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                          <span className="text-[10px] uppercase font-bold text-[#5C6E87] block">Score</span>
                          <span className="font-black text-[#FC6235]">{cert.score}%</span>
                        </div>
                        {cert.position && (
                          <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E9EDF5]">
                            <span className="text-[10px] uppercase font-bold text-[#5C6E87] block">Position</span>
                            <span className="font-black text-[#1B3360]">Rank #{cert.position}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E9EDF5] flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                        Cryptographically Verified
                      </span>

                      <Link
                        href={`/certificates/verify?token=${cert.verificationToken}`}
                        className="text-xs font-bold text-[#FC6235] hover:underline flex items-center gap-1"
                      >
                        Verify Certificate
                        <ArrowSquareOut weight="bold" className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Attempts History */}
            {activeTab === "history" && (
              <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E9EDF5]">
                  <h2 className="text-sm font-black text-[#101E35]">Past Sprint Submissions</h2>
                </div>
                <div className="divide-y divide-[#E9EDF5] text-xs">
                  {attempts.map((att) => (
                    <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#101E35]">{att.quizTitle}</h3>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Completed on {new Date(att.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(att.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-[#FC6235] text-base">
                          {att.totalScore} / {att.maxScore} pts
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          OFFICIAL SUBMISSION
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Points Ledger */}
            {activeTab === "ledger" && (
              <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E9EDF5]">
                  <h2 className="text-sm font-black text-[#101E35]">Points Ledger (Audit Log)</h2>
                </div>
                <div className="divide-y divide-[#E9EDF5] text-xs">
                  {pointTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="font-bold text-[#101E35]">{tx.description}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()} • {tx.source}
                        </div>
                      </div>

                      <div className="font-black text-emerald-600 text-sm">
                        +{tx.points} PTS
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

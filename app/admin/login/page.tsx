"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockKey,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  ShieldCheck,
  ArrowRight,
  WarningCircle,
  Sparkle,
  ArrowLeft,
  CheckCircle,
} from "@phosphor-icons/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both administrator email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Authentication failed. Access denied.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Welcome back, ${data.data.user.name}! Redirecting to Admin Dashboard...`);
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 500);
    } catch {
      setErrorMessage("Network error. Could not connect to authentication gateway.");
      setIsLoading(false);
    }
  };

  const handleQuickDemoAdmin = async (roleType: "super_admin" | "unauthorized_user") => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const targetEmail =
      roleType === "super_admin" ? "admin@reversun.com" : "arun.kumar@example.com";
    const targetPass = roleType === "super_admin" ? "admin@12345" : "wrong-password";

    setEmail(targetEmail);
    setPassword(targetPass);

    try {
      const res = await fetch("/api/v1/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Access denied.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Verified ${data.data.user.role}! Redirecting...`);
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 500);
    } catch {
      setErrorMessage("Connection failed.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#FAF9F6] text-[#101E35] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Ambient background glow matching REVERSUN Brand */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FC6235]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#1B3360]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white border border-[#E9EDF5] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/50 relative z-10 transition-all">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6E87] hover:text-[#101E35] transition"
          >
            <ArrowLeft weight="bold" className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Link href="/" className="transition active:scale-95" title="REVERSUN">
            <Image
              src="/REVERSUN LOGO.png"
              alt="REVERSUN"
              width={180}
              height={50}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <h1 className="mt-4 font-black text-2xl sm:text-3xl text-[#101E35] tracking-tight text-center">
            Admin Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E87] text-center mt-1.5 leading-relaxed max-w-sm">
            Restricted access for competition directors, quiz creators, and system administrators.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
            <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2.5">
            <WarningCircle weight="fill" className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-red-900">Security Rejection</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          {/* Admin Email */}
          <div>
            <label className="block text-xs font-bold text-[#101E35] tracking-wide mb-1.5">
              Administrator Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <EnvelopeSimple weight="bold" className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@reversun.com"
                className="w-full bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl pl-10 pr-4 py-3 text-sm text-[#101E35] placeholder-slate-400 focus:outline-none focus:border-[#FC6235] focus:bg-white focus:ring-2 focus:ring-[#FC6235]/30 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#101E35] tracking-wide">
                Master Security Password
              </label>
              <button
                type="button"
                onClick={() => alert("Please consult REVERSUN Root Ops to reset your administrator credentials.")}
                className="text-[11px] text-[#5C6E87] hover:text-[#101E35] hover:underline"
              >
                Forgot credentials?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LockKey weight="bold" className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#FAF9F6] border border-[#E9EDF5] rounded-xl pl-10 pr-10 py-3 text-sm text-[#101E35] placeholder-slate-400 focus:outline-none focus:border-[#FC6235] focus:bg-white focus:ring-2 focus:ring-[#FC6235]/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlash weight="bold" className="w-4 h-4" />
                ) : (
                  <Eye weight="bold" className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FC6235] hover:bg-[#e05327] active:scale-[0.99] text-white font-black text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#FC6235]/25 hover:shadow-lg hover:shadow-[#FC6235]/35 transition cursor-pointer mt-5 disabled:opacity-60"
          >
            <span>{isLoading ? "Verifying Credentials..." : "Authenticate & Enter Portal"}</span>
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-[10px] text-slate-400">
          Protected by REVERSUN Role-Based Access Control (RBAC) & Audit Logging.
        </div>
      </div>
    </main>
  );
}

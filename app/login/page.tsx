"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Trophy,
  Certificate,
  Lightning,
  Sparkle,
  ArrowRight,
  CircleNotch,
  WarningCircle,
  ArrowLeft,
  CheckCircle,
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  User as UserIcon,
} from "@phosphor-icons/react";
import { useUserAuth } from "@/context/UserAuthContext";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/profile";

  const {
    user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithDemoGoogle,
    resetPassword,
    isLoading: authGlobalLoading,
  } = useUserAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect when user is authenticated
  React.useEffect(() => {
    if (user && !authGlobalLoading && !submitting) {
      router.push(redirectUrl);
    }
  }, [user, authGlobalLoading, submitting, redirectUrl, router]);

  // Translate Firebase Auth error codes into human-friendly explanations
  const parseAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || "";
    const msg = err instanceof Error ? err.message : String(err);

    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password. Please verify your credentials or click 'Forgot Password'.";
      case "auth/user-not-found":
        return "No account exists with this email address. Please switch to 'Create Account' to sign up.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please switch to 'Sign In'.";
      case "auth/weak-password":
        return "Password is too weak. Please choose a password with at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing.";
      case "auth/popup-blocked":
        return "Google popup was blocked by your browser. Please allow popups for this site.";
      case "auth/operation-not-allowed":
      case "auth/configuration-not-found":
        return "Selected sign-in method is not enabled in Firebase Console. You can sign in using your email & password or 1-Click Demo Login below.";
      case "auth/network-request-failed":
        return "Network connection error. Please check your internet connection.";
      default:
        return msg || "Authentication failed. Please try again.";
    }
  };

  // Sign In Handler
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      router.push(redirectUrl);
    } catch (err) {
      console.error("Sign-in error:", err);
      setErrorMessage(parseAuthError(err));
      setSubmitting(false);
    }
  };

  // Sign Up / Registration Handler
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(email.trim(), password, name.trim());
      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (err) {
      console.error("Sign-up error:", err);
      setErrorMessage(parseAuthError(err));
      setSubmitting(false);
    }
  };

  // Google OAuth Handler
  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await loginWithGoogle();
      router.push(redirectUrl);
    } catch (err: unknown) {
      console.error("Google sign-in caught error:", err);
      setErrorMessage(parseAuthError(err));
      setSubmitting(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter the email address for your account.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccessMessage(`A password reset link has been sent to ${email.trim()}. Please check your inbox.`);
      setSubmitting(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setErrorMessage(parseAuthError(err));
      setSubmitting(false);
    }
  };

  // 1-Click Instant Demo Login
  const handleDemoLogin = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await loginWithDemoGoogle("balaji.student@reversun.com", "Balaji (Student)");
      router.push(redirectUrl);
    } catch (err) {
      console.error("Demo login error:", err);
      setErrorMessage("Demo login failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back to Home Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6E87] hover:text-[#FC6235] transition"
        >
          <ArrowLeft weight="bold" className="w-4 h-4" />
          Back to Public Portal
        </Link>

        <span className="text-[11px] font-semibold text-[#8E9EAF]">
          Powered by Firebase Auth
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xl p-8 sm:p-10 relative overflow-hidden">
        {/* Brand Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FC6235] via-[#FF5D37] to-[#1B3360]" />

        {/* Card Header with Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/REVERSUN LOGO.png"
              alt="Reversun"
              width={190}
              height={48}
              style={{ width: "auto", height: "38px" }}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-black text-[#101E35] tracking-tight">
            {mode === "signin"
              ? "Welcome Back"
              : mode === "signup"
              ? "Create Your Account"
              : "Reset Password"}
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1.5 leading-relaxed">
            {mode === "signin"
              ? "Sign in with your Firebase account to compete, earn points, and claim verified certificates."
              : mode === "signup"
              ? "Register in seconds to take live challenges, build your rank, and receive official credentials."
              : "Enter your registered email address and we'll send you an official reset link."}
          </p>
        </div>

        {/* Mode Switch Tabs (Sign In vs Create Account) */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-[#F4F6FA] rounded-2xl mb-6 border border-[#E9EDF5]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === "signin"
                  ? "bg-white text-[#1B3360] shadow-xs"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === "signup"
                  ? "bg-white text-[#1B3360] shadow-xs"
                  : "text-[#5C6E87] hover:text-[#101E35]"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
            <WarningCircle weight="fill" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle weight="fill" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: SIGN IN */}
        {/* ------------------------------------------------------------- */}
        {mode === "signin" && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <EnvelopeSimple weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#101E35]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] font-bold text-[#FC6235] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 pl-10 pr-10 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <LockKey weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8E9EAF] hover:text-[#101E35] transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeSlash weight="bold" className="w-4 h-4" /> : <Eye weight="bold" className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-r from-[#FC6235] to-[#FF5D37] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FC6235]/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                  <span>Signing in with Firebase...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Reversun</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: CREATE ACCOUNT (SIGN UP) */}
        {/* ------------------------------------------------------------- */}
        {mode === "signup" && (
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Balaji Kumar"
                  autoComplete="name"
                  required
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <UserIcon weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <EnvelopeSimple weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Password <span className="text-[10px] font-normal text-[#8E9EAF]">(min 6 characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-10 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <LockKey weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8E9EAF] hover:text-[#101E35] transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeSlash weight="bold" className="w-4 h-4" /> : <Eye weight="bold" className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <LockKey weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-r from-[#FC6235] to-[#FF5D37] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FC6235]/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                  <span>Creating Firebase Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: FORGOT PASSWORD */}
        {/* ------------------------------------------------------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#101E35] mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-[#E9EDF5] focus:outline-none focus:border-[#FC6235] focus:ring-2 focus:ring-[#FC6235]/15 transition bg-white text-[#101E35]"
                />
                <EnvelopeSimple weight="bold" className="w-4 h-4 text-[#8E9EAF] absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#1B3360] hover:bg-[#101E35] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Email...</span>
                </>
              ) : (
                <>
                  <span>Send Password Reset Email</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-[#5C6E87] hover:text-[#FC6235] transition"
              >
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Divider (only for sign in or sign up) */}
        {mode !== "forgot" && (
          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-[#E9EDF5] flex-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9EAF]">
              Or continue with
            </span>
            <div className="h-px bg-[#E9EDF5] flex-1" />
          </div>
        )}

        {/* Social / Alternative Logins */}
        {mode !== "forgot" && (
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full h-12 bg-white hover:bg-slate-50 text-[#101E35] font-bold text-xs rounded-xl border border-[#E9EDF5] hover:border-[#FC6235]/40 shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <GoogleIcon />
              <span className="text-[#1B3360] font-extrabold tracking-wide">
                Continue with Google
              </span>
            </button>

            {/* 1-Click Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full py-2.5 px-3 bg-[#FFF4EF] hover:bg-[#FFE8DE] text-[#FC6235] font-bold text-[11px] rounded-xl border border-[#FC6235]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkle weight="bold" className="w-3.5 h-3.5" />
              <span>1-Click Instant Test Login as Balaji (Student)</span>
            </button>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-[10px] text-center text-[#8E9EAF] mt-6 leading-relaxed">
          By signing in, you agree to REVERSUN Platform Terms, Fair Play Regulations, and Code of Conduct.
        </p>
      </div>

      {/* Admin Portal Footnote */}
      <div className="text-center mt-6">
        <p className="text-xs text-[#5C6E87]">
          Are you a Platform Administrator?{" "}
          <Link
            href="/admin/login"
            className="font-bold text-[#1B3360] hover:text-[#FC6235] underline transition"
          >
            Sign in to Admin Portal &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#FC6235]/10 via-[#1B3360]/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      <Suspense
        fallback={
          <div className="p-8 text-center text-xs font-bold text-[#5C6E87] flex items-center justify-center gap-2">
            <CircleNotch weight="bold" className="w-4 h-4 animate-spin text-[#FC6235]" />
            Loading authentication engine...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

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
} from "@phosphor-icons/react";
import { useUserAuth } from "@/context/UserAuthContext";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
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

  const { user, loginWithGoogle, loginWithDemoGoogle, isLoading } = useUserAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user && !isLoading) {
      router.push(redirectUrl);
    }
  }, [user, isLoading, redirectUrl, router]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      router.push(redirectUrl);
    } catch (err: unknown) {
      console.error("Sign-in caught error:", err);
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user") {
        setErrorMessage("Google Sign-In was closed. Please click the button again to proceed.");
      } else if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
        setErrorMessage(
          "Google Sign-In provider is not yet activated in Firebase Console. You can use 1-Click Demo Login below to test immediately!"
        );
      } else if (code === "auth/unauthorized-domain") {
        setErrorMessage(
          "Current domain is not in Firebase authorized domains list. You can use 1-Click Demo Login below to test immediately!"
        );
      } else {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        setErrorMessage(`${msg}. You can test immediately using 1-Click Demo Login below.`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleDemoLogin = async () => {
    setSigningIn(true);
    setErrorMessage(null);
    try {
      await loginWithDemoGoogle("balaji.student@reversun.com", "Balaji (Student)");
      router.push(redirectUrl);
    } catch (err) {
      setErrorMessage("Demo login failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back to Home Link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6E87] hover:text-[#FC6235] transition"
        >
          <ArrowLeft weight="bold" className="w-4 h-4" />
          Back to Public Portal
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-[#E9EDF5] shadow-xl p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle Brand Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FC6235] via-[#FF5D37] to-[#1B3360]" />

        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/REVERSUN LOGO.png"
              alt="Reversun"
              width={200}
              height={50}
              style={{ width: "auto", height: "40px" }}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-black text-[#101E35] tracking-tight">
            Welcome to Reversun
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1.5 leading-relaxed">
            Sign in to attempt live competitions, track your performance, earn points, and receive verified digital certificates.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 animate-in fade-in">
            <WarningCircle weight="fill" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sign in with Google Button — Primary Action */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full h-14 bg-white hover:bg-slate-50 text-[#101E35] font-bold text-sm rounded-2xl border-2 border-[#E9EDF5] hover:border-[#FC6235]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {signingIn ? (
              <>
                <CircleNotch weight="bold" className="w-5 h-5 text-[#FC6235] animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span className="text-[#1B3360] font-extrabold text-sm tracking-wide">
                  Continue with Google
                </span>
              </>
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[10px] text-center text-[#5C6E87] mt-6 leading-relaxed">
          By signing in, you agree to our Platform Rules, Fair Competition Policy, and Anti-Cheating Terms.
        </p>
      </div>

      {/* Admin Portal Redirect Footnote */}
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

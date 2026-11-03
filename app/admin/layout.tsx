"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  SignOut,
  ArrowLeft,
  CircleNotch,
  WarningCircle,
  ChartBar,
  Lightning,
  Question,
  Users,
  Broadcast,
  Trophy,
  Certificate,
  List,
  X,
  PlusCircle,
} from "@phosphor-icons/react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [isLoading, setIsLoading] = useState(!isLoginPage);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkAdminSession() {
      try {
        const res = await fetch("/api/v1/auth/admin-session");
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (isMounted) {
            setAuthError(data.message || "Unauthorized");
            router.replace("/admin/login");
          }
          return;
        }

        if (isMounted) {
          setAdminUser(data.data.user);
          setAuthError(null);
        }
      } catch {
        if (isMounted) {
          setAuthError("Failed to verify administrator privileges.");
          router.replace("/admin/login");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/v1/auth/admin-session", { method: "POST" });
    } finally {
      router.replace("/admin/login");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !adminUser) {
    if (authError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#101E35]">
          <div className="w-full max-w-sm bg-white border border-red-200 rounded-3xl p-8 shadow-lg flex flex-col items-center text-center space-y-4">
            <WarningCircle weight="fill" className="w-10 h-10 text-red-600" />
            <h3 className="font-bold text-base text-red-900">Access Denied</h3>
            <p className="text-xs text-slate-600">
              {authError}
            </p>
            <Link
              href="/admin/login"
              className="w-full py-2.5 bg-[#FC6235] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Go to Admin Login
            </Link>
          </div>
          <div className="hidden" aria-hidden="true">
            {children}
          </div>
        </div>
      );
    }

    // Verification in-progress: Clean Loading Spinner, never show Access Denied
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#101E35]">
        <div className="w-full max-w-sm bg-white border border-[#E9EDF5] rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Image
              src="/REVERSUN LOGO.png"
              alt="REVERSUN"
              width={160}
              height={44}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
          <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#101E35]">Verifying Security Credentials</h3>
            <p className="text-xs text-[#5C6E87]">Validating administrator permissions...</p>
          </div>
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: ChartBar },
    { label: "Quizzes & Competitions", href: "/admin/quizzes", icon: Lightning },
    { label: "Question Bank & Import", href: "/admin/questions", icon: Question },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Live Monitoring", href: "/admin/monitoring", icon: Broadcast },
    { label: "Prizes & Rewards", href: "/admin/prizes", icon: Trophy },
    { label: "Results & Certificates", href: "/admin/results", icon: Certificate },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#101E35] flex flex-col font-sans">
      {/* Top Global Admin Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E9EDF5] px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X weight="bold" className="w-5 h-5" /> : <List weight="bold" className="w-5 h-5" />}
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-200" />

          {/* Official Reversun Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/REVERSUN LOGO.png"
              alt="Reversun"
              width={140}
              height={40}
              priority
              className="h-7 w-auto object-contain"
            />
            <span className="px-2 py-0.5 rounded-md bg-[#1B3360] text-white text-[10px] font-black uppercase tracking-wider">
              Admin Console
            </span>
          </Link>
        </div>

        {/* Authenticated Admin Identity */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-[#101E35]">{adminUser.name}</span>
            <span className="text-[10px] text-[#5C6E87] flex items-center justify-end gap-1 font-mono">
              <ShieldCheck weight="fill" className="w-3 h-3 text-emerald-600" />
              {adminUser.role} • {adminUser.email}
            </span>
          </div>
        </div>
      </header>

      {/* Admin Shell: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#E9EDF5] bg-white p-4 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {/* Create Quiz CTA in Sidebar */}
          <Link
            href="/admin/quizzes/create"
            className="w-full mb-4 py-2.5 px-3 rounded-xl bg-[#FC6235] hover:bg-[#e05327] text-white text-xs font-bold transition shadow-sm shadow-[#FC6235]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle weight="bold" className="w-4 h-4" />
            <span>Create Quiz</span>
          </Link>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Portal Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive
                    ? "bg-[#FFF4EF] text-[#FC6235] border border-[#FC6235]/30 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  <Icon
                    weight={isActive ? "fill" : "duotone"}
                    className={`w-4 h-4 ${isActive ? "text-[#FC6235]" : "text-slate-400"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Sidebar Sign Out Section */}
          <div className="mt-auto pt-4 border-t border-[#E9EDF5] space-y-3">
            <div className="px-2 py-1.5 rounded-xl bg-slate-50 border border-[#E9EDF5] text-[11px]">
              <div className="font-bold text-[#101E35] truncate">{adminUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{adminUser.email}</div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              title="End administrator session"
            >
              <SignOut weight="bold" className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white p-4 flex flex-col h-full shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9EDF5] mb-3">
                <span className="text-xs font-bold text-[#101E35]">Admin Menu</span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X weight="bold" className="w-4 h-4" />
                </button>
              </div>

              {/* Create Quiz in Mobile Drawer */}
              <Link
                href="/admin/quizzes/create"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full mb-3 py-2.5 px-3 rounded-xl bg-[#FC6235] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle weight="bold" className="w-4 h-4" />
                <span>Create Quiz</span>
              </Link>

              <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${isActive
                        ? "bg-[#FFF4EF] text-[#FC6235] border border-[#FC6235]/30"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <Icon weight={isActive ? "fill" : "duotone"} className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#E9EDF5] mt-auto">
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SignOut weight="bold" className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Admin View Content with consistent gap from sidebar */}
        <main className="flex-1 min-w-0 bg-[#FAF9F6] p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#101E35]">
          <div className="w-full max-w-sm bg-white border border-[#E9EDF5] rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col items-center text-center space-y-4">
            <CircleNotch weight="bold" className="w-8 h-8 text-[#FC6235] animate-spin" />
            <p className="text-xs text-[#5C6E87]">Connecting to admin console...</p>
          </div>
        </div>
      }
    >
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

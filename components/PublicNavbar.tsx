"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Lightning,
  Certificate,
  User,
  ShieldCheck,
  ArrowRight,
  List,
  X,
  House,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react";
import { useUserAuth } from "@/context/UserAuthContext";

function GoogleIconSmall() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
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

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useUserAuth();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary navigation links (clean, non-redundant)
  const navLinks = [
    { label: "Home", href: "/", icon: House },
    { label: "Competitions", href: "/quizzes", icon: Lightning },
    { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
    { label: "Verify Certificate", href: "/certificates/verify", icon: Certificate },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getFirstName = (name?: string | null) => {
    if (!name) return "Account";
    return name.trim().split(" ")[0];
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E9EDF5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/REVERSUN LOGO.png"
            alt="Reversun"
            width={160}
            height={40}
            style={{ width: "auto", height: "34px" }}
            className="object-contain"
            priority
          />
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1.5 transition-colors relative whitespace-nowrap ${active
                    ? "text-[#FC6235] font-bold"
                    : "text-[#5C6E87] hover:text-[#101E35]"
                  }`}
              >
                <span>{link.label}</span>
                {active && (
                  <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-[#FC6235] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Desktop Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Logged In User Dropdown Widget */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 py-1.5 pl-2 pr-3 rounded-full bg-[#FAF9F6] hover:bg-[#FFF4EF] border border-[#E9EDF5] hover:border-[#FC6235]/30 transition shadow-2xs group cursor-pointer"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FC6235] to-[#FF5D37] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {getInitials(user.name)}
                </div>
                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-xs font-bold text-[#101E35] group-hover:text-[#FC6235] transition max-w-[120px] truncate">
                    {getFirstName(user.displayName || user.name)}
                  </div>
                  <div className="text-[10px] text-[#5C6E87]">Candidate</div>
                </div>
                <CaretDown
                  weight="bold"
                  className={`w-3.5 h-3.5 text-[#5C6E87] transition-transform duration-200 ${userDropdownOpen ? "rotate-180 text-[#FC6235]" : ""
                    }`}
                />
              </button>

              {/* Dropdown Card */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E9EDF5] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* User Profile Summary */}
                  <div className="px-4 py-3 border-b border-[#E9EDF5] bg-gradient-to-b from-[#FFFDF9] to-white">
                    <div className="text-xs font-bold text-[#101E35] truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-[#5C6E87] truncate">
                      {user.email}
                    </div>
                    <div className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Competitor
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-1 space-y-0.5 text-xs font-semibold">
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#101E35] hover:bg-[#FFF4EF] hover:text-[#FC6235] transition"
                    >
                      <User weight="bold" className="w-4 h-4 text-[#FC6235]" />
                      <span>My Profile & Details</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#101E35] hover:bg-[#FFF4EF] hover:text-[#FC6235] transition"
                    >
                      <Certificate weight="bold" className="w-4 h-4 text-[#FC6235]" />
                      <span>My Certificates Wall</span>
                    </Link>

                    <Link
                      href="/quizzes"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#101E35] hover:bg-[#FFF4EF] hover:text-[#FC6235] transition"
                    >
                      <Lightning weight="bold" className="w-4 h-4 text-[#FC6235]" />
                      <span>My Competitions</span>
                    </Link>

                    <div className="my-1 border-t border-[#E9EDF5]" />

                    <Link
                      href="/admin/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#5C6E87] hover:bg-slate-50 hover:text-[#1B3360] transition"
                    >
                      <ShieldCheck weight="duotone" className="w-4 h-4 text-[#1B3360]" />
                      <span>Admin Portal</span>
                    </Link>

                    <div className="my-1 border-t border-[#E9EDF5]" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <SignOut weight="bold" className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out: Clean Sign In Button */
            <>
              <Link
                href="/admin/login"
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#5C6E87] hover:text-[#1B3360] transition"
              >
                <ShieldCheck weight="duotone" className="w-4 h-4 text-[#1B3360]" />
                <span>Admin</span>
              </Link>

              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-bold rounded-xl text-[#101E35] bg-white hover:bg-slate-50 border border-[#E9EDF5] shadow-2xs transition flex items-center gap-2"
              >
                <GoogleIconSmall />
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FC6235] to-[#FF5D37] text-white flex items-center justify-center font-black text-xs shadow-xs"
            >
              {getInitials(user.name)}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl text-[#101E35] bg-white border border-[#E9EDF5] flex items-center gap-1.5"
            >
              <GoogleIconSmall />
              <span>Login</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#101E35] hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X weight="bold" className="w-6 h-6 text-[#101E35]" />
            ) : (
              <List weight="bold" className="w-6 h-6 text-[#101E35]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E9EDF5] px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {user && (
            <div className="p-3 mb-2 rounded-2xl bg-[#FFF4EF] border border-[#FC6235]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FC6235] to-[#FF5D37] text-white flex items-center justify-center font-bold text-xs">
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101E35]">{user.name}</div>
                  <div className="text-[10px] text-[#5C6E87]">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-rose-600 px-2 py-1 rounded-lg hover:bg-white"
              >
                Sign out
              </button>
            </div>
          )}

          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition ${active
                    ? "bg-[#FFF4EF] text-[#FC6235]"
                    : "text-[#5C6E87] hover:bg-slate-50 hover:text-[#101E35]"
                  }`}
              >
                <Icon weight={active ? "fill" : "bold"} className="w-4 h-4 text-[#FC6235]" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-[#5C6E87] hover:bg-slate-50 hover:text-[#101E35]"
            >
              <User weight="bold" className="w-4 h-4 text-[#FC6235]" />
              <span>My Profile & Details</span>
            </Link>
          )}

          <div className="pt-3 border-t border-[#E9EDF5] grid grid-cols-2 gap-2">
            <Link
              href="/quizzes"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl text-center text-xs font-bold text-white bg-gradient-to-r from-[#FC6235] to-[#FF5D37] flex items-center justify-center gap-1.5"
            >
              <Lightning weight="bold" className="w-3.5 h-3.5" />
              Play Now
            </Link>

            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl border border-[#E9EDF5] text-center text-xs font-bold text-[#1B3360] bg-white flex items-center justify-center gap-1.5"
            >
              <ShieldCheck weight="duotone" className="w-4 h-4 text-[#FC6235]" />
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

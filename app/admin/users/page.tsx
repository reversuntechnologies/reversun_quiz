"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  UserGear,
  CircleNotch,
  CheckCircle,
  XCircle,
  Trophy,
  Certificate,
  ArrowsClockwise,
  Prohibit,
  Check,
} from "@phosphor-icons/react";

interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  totalPoints: number;
  attemptsCount: number;
  registrationsCount: number;
  certificatesCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/users");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load users");
      }
      setUsers(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    setActionInProgress(userId);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setActionInProgress(userId);
    const newStatus = !currentStatus;
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
      );
      showToast(`User account ${newStatus ? "reactivated" : "suspended"}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "SUSPENDED" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const admins = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
    const totalPoints = users.reduce((acc, u) => acc + (u.totalPoints || 0), 0);
    return { total, active, admins, totalPoints };
  }, [users]);

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
            <Users weight="duotone" className="w-4 h-4" />
            <span>Identity & Access Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101E35]">
            User Management
          </h1>
          <p className="text-xs text-[#5C6E87] mt-1">
            Audit user accounts, assign administrative privileges, and monitor competition participation.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-[#E9EDF5] bg-white text-[#1B3360] hover:bg-slate-50 transition shadow-xs"
        >
          <ArrowsClockwise weight="bold" className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Total Users</div>
          <div className="text-2xl font-black text-[#101E35] mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Active Accounts</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Administrators</div>
          <div className="text-2xl font-black text-[#1B3360] mt-1">{stats.admins}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E9EDF5] shadow-xs">
          <div className="text-xs font-bold text-[#5C6E87] uppercase tracking-wider">Points Circulating</div>
          <div className="text-2xl font-black text-[#FC6235] mt-1">{stats.totalPoints.toLocaleString()} pts</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, display name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] focus:outline-hidden focus:border-[#FC6235] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#5C6E87]">
            <Funnel weight="bold" className="w-3.5 h-3.5" />
            <span className="font-semibold">Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-[#E9EDF5] bg-[#FAF9F6] text-[#101E35] font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#5C6E87] flex flex-col items-center justify-center gap-2">
            <CircleNotch weight="bold" className="w-6 h-6 animate-spin text-[#FC6235]" />
            <span className="text-xs font-semibold">Loading directory records...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50 text-xs font-semibold">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#5C6E87]">
            <Users weight="duotone" className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No users matched your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9EDF5] bg-[#FAF9F6] text-[11px] font-bold text-[#5C6E87] uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Quizzes</th>
                  <th className="py-3 px-4 text-center">Certificates</th>
                  <th className="py-3 px-4 text-right">Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5] text-xs">
                {filteredUsers.map((u) => {
                  const isBusy = actionInProgress === u.id;
                  const initials = (u.name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B3360] to-[#254580] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#101E35] flex items-center gap-1.5">
                              {u.displayName || u.name}
                              {u.role === "SUPER_ADMIN" && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.2 rounded-md">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#5C6E87]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : u.role === "ADMIN"
                              ? "bg-blue-50 text-[#1B3360] border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <ShieldCheck weight="fill" className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Suspended
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-[#101E35]">
                        {u.attemptsCount}
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-[#101E35]">
                        <span className="inline-flex items-center gap-1">
                          <Certificate weight="duotone" className="w-3.5 h-3.5 text-[#FC6235]" />
                          {u.certificatesCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-[#FC6235]">
                        {u.totalPoints} pts
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="text-[11px] text-slate-400 font-medium italic">Immutable</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role Toggle */}
                            <button
                              disabled={isBusy}
                              onClick={() => handleRoleChange(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}
                              title={u.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#E9EDF5] bg-white hover:bg-slate-100 text-[#1B3360] transition shadow-2xs disabled:opacity-50"
                            >
                              {u.role === "ADMIN" ? "Demote" : "Make Admin"}
                            </button>

                            {/* Status Toggle */}
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusToggle(u.id, u.isActive)}
                              title={u.isActive ? "Suspend Account" : "Reactivate Account"}
                              className={`p-1.5 rounded-lg border transition shadow-2xs disabled:opacity-50 ${
                                u.isActive
                                  ? "border-rose-200 bg-white hover:bg-rose-50 text-rose-600"
                                  : "border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {u.isActive ? (
                                <Prohibit weight="bold" className="w-3.5 h-3.5" />
                              ) : (
                                <Check weight="bold" className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

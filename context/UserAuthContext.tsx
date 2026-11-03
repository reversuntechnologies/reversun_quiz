"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  phone?: string | null;
  bio?: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  totalPoints?: number;
  quizzesAttended?: number;
}

interface UserAuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDemoGoogle: (demoEmail?: string, demoName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "reversun_user_profile";
const LOCAL_STORAGE_TOKEN_KEY = "reversun_user_token";

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile from backend Neon DB
  const syncWithBackend = useCallback(async (firebaseUid: string, email: string, name: string, avatarUrl: string | null, idToken: string) => {
    try {
      const res = await fetch("/api/v1/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid,
          email,
          name,
          displayName: name,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const syncedUser: UserProfile = {
          id: data.data.id,
          firebaseUid: data.data.firebaseUid,
          email: data.data.email,
          name: data.data.name || name,
          displayName: data.data.displayName || name,
          avatarUrl: data.data.avatarUrl || avatarUrl,
          role: data.data.role || "USER",
        };
        setUser(syncedUser);
        setToken(idToken);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(syncedUser));
          localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, idToken);
        }
        return syncedUser;
      }
    } catch (err) {
      console.error("Backend auth sync error:", err);
    }
    return null;
  }, []);

  // Initialize from localStorage and Firebase Auth listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (e) {
        console.warn("Could not load stored user session", e);
      }
    }

    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser && fbUser.email) {
        try {
          const idToken = await fbUser.getIdToken();
          await syncWithBackend(
            fbUser.uid,
            fbUser.email,
            fbUser.displayName || fbUser.email.split("@")[0] || "User",
            fbUser.photoURL || null,
            idToken
          );
        } catch (e) {
          console.error("Error refreshing Firebase token on auth state change:", e);
        }
      } else {
        // If not in Firebase but exists in localStorage as demo, preserve it unless explicitly logged out
        const savedUser = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_USER_KEY) : null;
        if (!savedUser) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  // Google OAuth Login Handler
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase Auth client is not initialized. Please verify configuration.");
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error("No verified email found on your Google Account.");
      }

      const idToken = await fbUser.getIdToken();
      await syncWithBackend(
        fbUser.uid,
        fbUser.email,
        fbUser.displayName || fbUser.email.split("@")[0] || "User",
        fbUser.photoURL || null,
        idToken
      );
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Google Login (allows instant testing in case Firebase Google provider has not yet been toggled on in Google Cloud Console)
  const loginWithDemoGoogle = async (
    demoEmail = "balaji.student@reversun.com",
    demoName = "Balaji (Student)"
  ) => {
    setIsLoading(true);
    try {
      const demoUid = `google_${demoEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const demoToken = `dev-token-${demoUid}`;
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${demoUid}`;

      const synced = await syncWithBackend(demoUid, demoEmail, demoName, avatarUrl, demoToken);
      if (!synced) {
        // Fallback local profile if backend is unreachable
        const fallbackUser: UserProfile = {
          id: demoUid,
          firebaseUid: demoUid,
          email: demoEmail,
          name: demoName,
          displayName: demoName,
          avatarUrl,
          role: "USER",
        };
        setUser(fallbackUser);
        setToken(demoToken);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackUser));
          localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, demoToken);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Handler
  const logout = async () => {
    setIsLoading(true);
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn("Firebase sign out warning:", e);
    } finally {
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      }
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!token && !user) return;
    try {
      const res = await fetch("/api/v1/users/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser((prev) => ({ ...prev, ...data.data }));
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({ ...user, ...data.data }));
        }
      }
    } catch (e) {
      console.warn("Could not refresh user profile", e);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        loginWithDemoGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}

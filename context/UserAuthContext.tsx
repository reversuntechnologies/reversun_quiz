"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, getFirebaseAuth } from "@/lib/firebase/client";

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
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithDemoGoogle: (demoEmail?: string, demoName?: string) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
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

  // Sync profile with authoritative Neon PostgreSQL backend
  const syncWithBackend = useCallback(
    async (
      firebaseUid: string,
      email: string,
      name: string,
      avatarUrl: string | null,
      idToken: string
    ): Promise<UserProfile | null> => {
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

      // Safe local fallback so user authentication does not freeze
      const fallbackUser: UserProfile = {
        id: firebaseUid,
        firebaseUid,
        email,
        name,
        displayName: name,
        avatarUrl,
        role: "USER",
      };
      setUser(fallbackUser);
      setToken(idToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackUser));
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, idToken);
      }
      return fallbackUser;
    },
    []
  );

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

    const authInstance = auth || getFirebaseAuth();
    if (!authInstance) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (fbUser: FirebaseUser | null) => {
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
        const savedToken = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) : null;
        if (!savedToken || !savedToken.startsWith("dev-token-")) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  // Firebase Email & Password Login
  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authInstance = auth || getFirebaseAuth();
      if (!authInstance) {
        throw new Error("Firebase Auth client is not initialized.");
      }

      const result = await signInWithEmailAndPassword(authInstance, email.trim(), pass);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error("No verified email associated with this account.");
      }

      const idToken = await fbUser.getIdToken();
      const synced = await syncWithBackend(
        fbUser.uid,
        fbUser.email,
        fbUser.displayName || fbUser.email.split("@")[0] || "User",
        fbUser.photoURL || null,
        idToken
      );

      return synced || {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split("@")[0] || "User",
        role: "USER",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Email & Password Registration (Sign Up)
  const registerWithEmail = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authInstance = auth || getFirebaseAuth();
      if (!authInstance) {
        throw new Error("Firebase Auth client is not initialized.");
      }

      const result = await createUserWithEmailAndPassword(authInstance, email.trim(), pass);
      const fbUser = result.user;

      if (name.trim()) {
        try {
          await updateProfile(fbUser, { displayName: name.trim() });
        } catch (e) {
          console.warn("Could not set displayName on Firebase user:", e);
        }
      }

      const idToken = await fbUser.getIdToken(true);
      const synced = await syncWithBackend(
        fbUser.uid,
        fbUser.email || email.trim(),
        name.trim() || email.split("@")[0],
        null,
        idToken
      );

      return synced || {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        email: fbUser.email || email.trim(),
        name: name.trim() || email.split("@")[0],
        displayName: name.trim() || email.split("@")[0],
        role: "USER",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login Handler
  const loginWithGoogle = async (): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const authInstance = auth || getFirebaseAuth();
      if (!authInstance) {
        throw new Error("Firebase Auth client is not initialized.");
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(authInstance, provider);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error("No verified email found on your Google Account.");
      }

      const idToken = await fbUser.getIdToken();
      const synced = await syncWithBackend(
        fbUser.uid,
        fbUser.email,
        fbUser.displayName || fbUser.email.split("@")[0] || "User",
        fbUser.photoURL || null,
        idToken
      );

      return synced || {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split("@")[0] || "User",
        role: "USER",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Password Reset Email
  const resetPassword = async (email: string): Promise<void> => {
    const authInstance = auth || getFirebaseAuth();
    if (!authInstance) {
      throw new Error("Firebase Auth client is not initialized.");
    }
    await sendPasswordResetEmail(authInstance, email.trim());
  };

  // 1-Click Demo Google Login (allows instant testing)
  const loginWithDemoGoogle = async (
    demoEmail = "balaji.student@reversun.com",
    demoName = "Balaji (Student)"
  ): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const demoUid = `google_${demoEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const demoToken = `dev-token-${demoUid}`;
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${demoUid}`;

      const synced = await syncWithBackend(demoUid, demoEmail, demoName, avatarUrl, demoToken);
      if (synced) return synced;

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
      return fallbackUser;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Handler
  const logout = async () => {
    setIsLoading(true);
    try {
      const authInstance = auth || getFirebaseAuth();
      if (authInstance) {
        await firebaseSignOut(authInstance);
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
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithDemoGoogle,
        resetPassword,
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

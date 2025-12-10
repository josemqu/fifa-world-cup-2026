"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface DbUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  nickname?: string;
  country?: string;
  favoriteTeam?: string;
  gender?: string;
  age?: number;
  birthDate?: string;
  role?: "user" | "admin";
  preferences?: {
    language: string;
  };
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  profileComplete: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<DbUser>) => Promise<void>;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (isOpen: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const profileComplete = useMemo(() => {
    if (!dbUser) return false;
    return !!(
      dbUser.displayName &&
      dbUser.nickname &&
      dbUser.country &&
      dbUser.favoriteTeam &&
      dbUser.gender &&
      (dbUser.age || dbUser.birthDate)
    );
  }, [dbUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // First try to get existing user data from MongoDB
          const getResponse = await fetch(`/api/user?uid=${currentUser.uid}`);

          if (getResponse.ok) {
            const data = await getResponse.json();
            if (data.success) {
              setDbUser(data.data);
            }
          } else if (getResponse.status === 404) {
            // If user doesn't exist, create/sync via POST
            const response = await fetch("/api/user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firebaseUid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setDbUser(data.data);
              }
            }
          }
        } catch (error) {
          console.error("Error syncing user with DB:", error);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setDbUser(null);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<DbUser>) => {
    if (!user) return;

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          ...data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDbUser(result.data);
        }
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        profileComplete,
        loginWithGoogle,
        logout,
        updateProfile,
        isProfileModalOpen,
        setProfileModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

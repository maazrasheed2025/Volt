// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { UserRole } from '../types.ts';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | AppUser | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (role?: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'Admin/Owner',
  setRole: () => {},
  token: null,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  signInWithDemo: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AppUser | null>(null);
  const [role, setRoleState] = useState<UserRole>('Admin/Owner');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          // Fetch user profile from DB
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.role) {
              setRoleState(data.role as UserRole);
            }
          }
        } catch (e) {
          console.warn('Failed to sync auth user profile:', e);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setRole = async (newRole: UserRole) => {
    setRoleState(newRole);
    if (user && token && !('isDemo' in user && user.isDemo)) {
      try {
        await fetch('/api/auth/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ role: newRole, uid: user.uid })
        });
      } catch (err) {
        console.warn('Failed to persist user role:', err);
      }
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or cancelled the popup dialog - normal user action, not a system failure
        console.info('Google Sign-in dialog was closed or cancelled by user.');
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        const msg = 'Sign-in popup was blocked by your browser. Please enable popups or use Demo Login.';
        setAuthError(msg);
        console.warn('Google Sign-in popup blocked:', msg);
        return;
      }
      const msg = err?.message || 'Google sign-in could not be completed. Please try again or use Demo mode.';
      setAuthError(msg);
      console.warn('Google sign-in notification:', msg);
    }
  };

  const signInWithDemo = (demoRole: UserRole = 'Admin/Owner') => {
    setUser({
      uid: 'demo-director-user',
      email: 'imran@voltedge.in',
      displayName: 'Imran (CMD / Owner)',
      isDemo: true,
    });
    setRoleState(demoRole);
    setToken(null);
    setAuthError(null);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Sign-out issue:', err);
    }
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        token,
        loading,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

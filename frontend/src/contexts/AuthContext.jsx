import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentProfile, signIn, signOut, onAuthChange } from '../lib/db';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentProfile()
      .then(profile => { if (active) setUser(profile); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setChecking(false); });

    const unsubscribe = onAuthChange((event) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        getCurrentProfile()
          .then(profile => { if (active) setUser(profile); })
          .catch(() => {});
      }
    });

    return () => { active = false; unsubscribe(); };
  }, []);

  const login = async (username, password) => {
    // signIn kaster Error med 'WRONG_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR'
    const profile = await signIn(username, password);
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

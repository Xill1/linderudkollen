import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(u => { setUser(u); setChecking(false); })
        .catch(() => { localStorage.removeItem('admin_token'); setChecking(false); });
    } else {
      setChecking(false);
    }
  }, []);

  const login = async (username, password) => {
    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error('NETWORK_ERROR');
    }
    if (res.status === 401) {
      throw new Error('WRONG_CREDENTIALS');
    }
    if (!res.ok) {
      throw new Error('SERVER_ERROR');
    }
    const data = await res.json();
    localStorage.setItem('admin_token', data.token);
    setUser(data);
    return data;
  };

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

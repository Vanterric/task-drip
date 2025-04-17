import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!token;

  

  // Save to localStorage on change
  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  const verifyToken = async () => {
    if (!token) return;
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/verifyToken`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
    const data = await res.json();
    if (!data.valid) {
      logout();
    }
  };
  verifyToken();
  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, setToken, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

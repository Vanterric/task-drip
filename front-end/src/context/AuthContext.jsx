import { createContext, useContext, useEffect, useState } from "react";
import { checkIfCurrentDeviceSubscribed } from "../utilities/checkIfCurrentDeviceSubscribed";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || null);
  const [isFirst100User, setIsFirst100User] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isSubscribedToPushNotifications, setIsSubscribedToPushNotifications] = useState(false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem("isMuted") === "true");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [wasDowngraded, setWasDowngraded] = useState(false); 

  const isAuthenticated = !!token;


  useEffect(() => {
    
    if (!user?.isPro || !user?.proExpiresAt) return;
  
    const now = new Date();
    const expiry = new Date(user.proExpiresAt);
    
    if (expiry < now) {
      
      const downgradedUser = { ...user, isPro: false };
  
      fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      setUser(downgradedUser);
      localStorage.setItem('user', JSON.stringify(downgradedUser)); 
      setWasDowngraded(true);
    }
  }, [user]);

  useEffect(() => {
    
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        
        const data = await res.json();
        
        setUser(data);
        setIsFirst100User(data.isFirstHundredUser || false);
        setIsFirstTimeUser(data.isFirstTimeUser || false);
         if (user?.pushSubscriptions) {
          checkIfCurrentDeviceSubscribed(user.pushSubscriptions, setIsSubscribedToPushNotifications);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [token]);
  


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
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/signin";
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
    <AuthContext.Provider value={{ token, user, isAuthenticated, setToken, setUser, logout, wasDowngraded, setWasDowngraded, isFirst100User, isFirstTimeUser, setIsFirst100User, setIsFirstTimeUser, isSubscribedToPushNotifications, setIsSubscribedToPushNotifications, isMuted, setIsMuted }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

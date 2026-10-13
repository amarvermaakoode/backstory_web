"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const saveAuth = (token, user) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("userData", JSON.stringify(user));
  };

  const clearAuth = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userOrders");
    localStorage.removeItem("savedShippingAddress");
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    clearAuth();
  };

  const refreshUser = async (authToken) => {
    const activeToken = authToken || token || (typeof window !== "undefined" ? localStorage.getItem("userToken") : null);
    if (!activeToken) {
      clearSession();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/frontend/auth/me`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));

      // If account was deleted, deactivated, token is invalid, or role is admin: log out immediately!
      if (!res.ok || res.status === 401 || res.status === 403 || res.status === 404 || !data.success || !data.user || data.user.isDeactivated || data.user.role === "admin") {
        clearSession();
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/account")) {
          router.replace("/login");
        }
        return;
      }

      setUser(data.user);
      saveAuth(activeToken, data.user);
    } catch (err) {
      console.warn("Could not refresh user profile:", err?.message || err);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    const storedUser = localStorage.getItem("userData");

    let isStoredAdmin = false;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.role === "admin") {
          isStoredAdmin = true;
          clearAuth();
        } else {
          setUser(parsed);
        }
      } catch (error) {
        console.error("Invalid user data:", error);
        clearAuth();
      }
    }

    if (isStoredAdmin) {
      clearSession();
      setLoading(false);
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/account")) {
        router.replace("/login");
      }
      return;
    }

    if (storedToken) {
      setToken(storedToken);
      refreshUser(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Re-verify account validity whenever user returns to tab
    const handleRecheck = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const currentToken = localStorage.getItem("userToken");
        if (currentToken) {
          refreshUser(currentToken);
        }
      }
    };

    window.addEventListener("focus", handleRecheck);
    document.addEventListener("visibilitychange", handleRecheck);

    return () => {
      window.removeEventListener("focus", handleRecheck);
      document.removeEventListener("visibilitychange", handleRecheck);
    };
  }, []);

  const sendOtp = async ({ email, phoneNumber, type, mode }) => {
    try {
      const body = {};
      if (email) body.email = email;
      if (phoneNumber) body.phoneNumber = phoneNumber;
      if (type || mode) body.type = type || mode;

      const response = await fetch(`${API_BASE_URL}/frontend/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.message || "Failed to send OTP",
          accountNotFound: !!data.accountNotFound,
          accountExists: !!data.accountExists,
          isAdminAccount: !!data.isAdminAccount,
        };
      }
      return { success: true, mockOtp: data.mockOtp, message: data.message };
    } catch (error) {
      console.error("Send OTP Error:", error);
      return { success: false, error: error.message || "Failed to connect to authentication server." };
    }
  };

  const verifyOtp = async ({ email, phoneNumber, otp, type, mode }) => {
    try {
      const body = { otp };
      if (email) body.email = email;
      if (phoneNumber) body.phoneNumber = phoneNumber;
      if (type || mode) body.type = type || mode;

      const response = await fetch(`${API_BASE_URL}/frontend/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success || data.user?.role === "admin") {
        return {
          success: false,
          error:
            data.message ||
            (data.user?.role === "admin"
              ? "This account doesn't exist. Please sign up."
              : "OTP verification failed"),
          accountNotFound: !!data.accountNotFound || data.user?.role === "admin",
          accountExists: !!data.accountExists,
        };
      }

      setToken(data.token);
      setUser(data.user);
      saveAuth(data.token, data.user);

      return { success: true, user: data.user, isNewUser: data.isNewUser };
    } catch (error) {
      console.error("Verify OTP Error:", error);
      return { success: false, error: error.message || "Failed to verify code." };
    }
  };

  const logout = () => {
    clearSession();
    router.push("/");
  };

  const userFetch = async (endpoint, options = {}) => {
    const activeToken = token || localStorage.getItem("userToken");
    const response = await fetch(`${API_BASE_URL}/frontend${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(activeToken && {
          Authorization: `Bearer ${activeToken}`,
        }),
      },
    });

    if (response.status === 401 || response.status === 403 || response.status === 404) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/account")) {
        router.replace("/login");
      }
    }
    return response;
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtp,
        verifyOtp,
        logout,
        userFetch,
        refreshUser,
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

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
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    clearAuth();
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    const storedUser = localStorage.getItem("userData");

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid user data:", error);
        clearAuth();
      }
    }
    setLoading(false);
  }, []);

  const sendOtp = async ({ email, phoneNumber }) => {
    try {
      const body = {};
      if (email) body.email = email;
      if (phoneNumber) body.phoneNumber = phoneNumber;

      const response = await fetch(`${API_BASE_URL}/frontend/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP");
      }
      return { success: true, mockOtp: data.mockOtp, message: data.message };
    } catch (error) {
      console.error("Send OTP Error:", error);
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async ({ email, phoneNumber, otp }) => {
    try {
      const body = { otp };
      if (email) body.email = email;
      if (phoneNumber) body.phoneNumber = phoneNumber;

      const response = await fetch(`${API_BASE_URL}/frontend/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "OTP verification failed");
      }

      setToken(data.token);
      setUser(data.user);
      saveAuth(data.token, data.user);

      return { success: true, user: data.user, isNewUser: data.isNewUser };
    } catch (error) {
      console.error("Verify OTP Error:", error);
      return { success: false, error: error.message };
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

    if (response.status === 401) {
      clearSession();
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

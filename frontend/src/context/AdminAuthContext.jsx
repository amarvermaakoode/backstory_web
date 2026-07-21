"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";

const AdminAuthContext = createContext(null);

export { API_BASE_URL };

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // -------------------------
  // Local Storage Helpers
  // -------------------------

  const saveAuth = (token, admin) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(admin));
  };

  const clearAuth = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  const clearSession = () => {
    setToken(null);
    setAdmin(null);
    clearAuth();
  };

  // -------------------------
  // Restore Login
  // -------------------------

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    const storedAdmin = localStorage.getItem("adminUser");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Invalid admin data:", error);
        clearAuth();
      }
    }

    setLoading(false);
  }, []);

  // -------------------------
  // Login
  // -------------------------

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setAdmin(data.admin);

      saveAuth(data.token, data.admin);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Login Error:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  };

  // -------------------------
  // Logout
  // -------------------------

  const logout = async () => {
    try {
      const activeToken = token || localStorage.getItem("adminToken");

      if (activeToken) {
        await fetch(`${API_BASE_URL}/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      clearSession();
    }
  };

  // -------------------------
  // Authenticated Fetch
  // -------------------------

  const adminFetch = async (endpoint, options = {}) => {
    const activeToken = token || localStorage.getItem("adminToken");

    const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(activeToken && {
          Authorization: `Bearer ${activeToken}`,
        }),
      },
    });

    if (response.status === 401 || response.status === 403) {
      await logout();
    }

    return response;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        logout,
        adminFetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used within an AdminAuthProvider"
    );
  }

  return context;
}
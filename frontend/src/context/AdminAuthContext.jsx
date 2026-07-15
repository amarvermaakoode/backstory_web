"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AdminAuthContext = createContext(null);

export const API_BASE_URL = "http://localhost:5000/api";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Read from localStorage on mount (client-side only)
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("adminToken");
      const storedAdmin = localStorage.getItem("adminUser");
      if (storedToken && storedAdmin) {
        setToken(storedToken);
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch (e) {
          console.error("Failed to parse admin user", e);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      // Save states
      setToken(data.token);
      setAdmin(data.admin);

      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
      }

      return { success: true };
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
    router.push("/admin/login");
  };

  // Helper fetch method with authorization headers pre-configured
  const adminFetch = async (endpoint, options = {}) => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("adminToken") : null);
    
    const headers = {
      ...options.headers,
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      // Auto-logout on unauthorized
      logout();
    }

    return response;
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout, adminFetch }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

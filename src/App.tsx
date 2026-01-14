import React, { useEffect, useState, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface AuthState {
  authenticated: boolean | null;
  username: string | null;
  role?: string;
}

export const AuthContext = React.createContext<{
  auth: AuthState;
  refreshAuth: () => Promise<void>;
}>({ auth: { authenticated: null, username: null, role: undefined }, refreshAuth: async () => {} });

const App = () => {
  const [auth, setAuth] = useState<AuthState>({ authenticated: null, username: null, role: undefined });
  const authCheckTimeoutRef = useRef<NodeJS.Timeout>();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuth({ authenticated: true, username: data.username, role: data.role });
      } else {
        setAuth({ authenticated: false, username: null, role: undefined });
      }
    } catch (err) {
      setAuth({ authenticated: false, username: null, role: undefined });
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  useEffect(() => {
    // Initial auth check
    checkAuth();

    // Re-check auth status every 3 seconds to catch login/logout changes
    authCheckTimeoutRef.current = setInterval(() => {
      checkAuth();
    }, 3000);

    return () => {
      if (authCheckTimeoutRef.current) {
        clearInterval(authCheckTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state while checking authentication
  if (auth.authenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, refreshAuth }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={auth.authenticated ? <Navigate to="/" /> : <Login />}
              />
              <Route
                path="/"
                element={auth.authenticated ? <Index /> : <Navigate to="/login" />}
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

export default App;

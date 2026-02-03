import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#F9F8F6]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="font-serif text-sm text-gray-400 uppercase tracking-widest">Verifying Protocol...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <OrgProvider>{children}</OrgProvider>;
};

import { GoogleOAuthProvider } from '@react-oauth/google';

const App = () => {
    // NOTE: Replace with your actual Client ID!
    const clientId = "496875357222-45co1e0ck7mkcf83smk13q4ps7l52fuu.apps.googleusercontent.com";

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default App;

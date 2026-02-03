import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const [searchParams] = useSearchParams();
    const isSignupMode = searchParams.get('mode') === 'signup';

    // Modes: 'login' | 'signup' | 'forgot' | 'reset'
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        newPassword: '',
        email: '',
        otp: '',
        company: ''
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // New User Org Flow
    const [showOrgInput, setShowOrgInput] = useState(false);
    const [pendingGoogleToken, setPendingGoogleToken] = useState('');
    const [newOrgName, setNewOrgName] = useState('');
    const [createOrg, setCreateOrg] = useState(true); // Default to creating an org

    // Sync URL mode with state logic
    useEffect(() => {
        if (isSignupMode) setMode('signup');
        // If not signup, default to login is fine, but don't overwrite manual state changes like 'forgot'
        else if (mode === 'signup') setMode('login');
    }, [isSignupMode]);

    const { login } = useAuth();
    const navigate = useNavigate();

    // ... (helper functions getTitle, getSubtitle same as before) ...
    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Welcome back';
            case 'signup': return 'Request Access';
            case 'forgot': return 'Forgot Password';
            case 'reset': return 'Reset Password';
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case 'login': return 'Enter your credentials to access the console.';
            case 'signup': return 'Join the governance protocol.';
            case 'forgot': return 'Enter your email to receive a One-Time Password.';
            case 'reset': return 'Check your email (or console) for the OTP.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (mode === 'login') {
                // Login Logic (unchanged)
                const params = new URLSearchParams();
                params.append('username', formData.username);
                params.append('password', formData.password);

                const res = await fetch('http://localhost:8000/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params
                });

                if (!res.ok) throw new Error('Invalid credentials');

                const data = await res.json();

                // Get User Details
                const userRes = await fetch('http://localhost:8000/api/me', {
                    headers: { Authorization: `Bearer ${data.access_token}` }
                });
                const userData = await userRes.json();

                login(data.access_token, userData);
                navigate('/dashboard');

            } else if (mode === 'signup') {
                // Signup Logic
                const res = await fetch('http://localhost:8000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        password: formData.password,
                        company: createOrg ? formData.company : "" // Send empty if not creating org
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    if (errData.detail && Array.isArray(errData.detail)) {
                        throw new Error(errData.detail[0].msg);
                    }
                    throw new Error(errData.detail || 'Registration failed');
                }

                // Auto login after successful signup
                const loginParams = new URLSearchParams();
                loginParams.append('username', formData.username);
                loginParams.append('password', formData.password);

                const loginRes = await fetch('http://localhost:8000/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: loginParams
                });

                if (!loginRes.ok) {
                    setSuccessMsg('Registration successful! Please log in.');
                    setMode('login');
                    return;
                }

                const loginData = await loginRes.json();
                const userRes = await fetch('http://localhost:8000/api/me', {
                    headers: { Authorization: `Bearer ${loginData.access_token}` }
                });
                const userData = await userRes.json();
                login(loginData.access_token, userData);
                navigate('/dashboard');
                return;

            } else if (mode === 'forgot') {
                // Forgot Password Logic (unchanged)
                const res = await fetch('http://localhost:8000/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || 'Failed to send OTP');
                }

                setSuccessMsg('OTP sent to your email. Check console if testing locally.');
                setMode('reset');

            } else if (mode === 'reset') {
                // Reset Password Logic (unchanged)
                const res = await fetch('http://localhost:8000/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        otp: formData.otp,
                        new_password: formData.newPassword
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    if (errData.detail && Array.isArray(errData.detail)) {
                        throw new Error(errData.detail[0].msg);
                    }
                    throw new Error(errData.detail || 'Failed to reset password');
                }

                setSuccessMsg('Password reset successfully. Please login.');
                setMode('login');
            }

        } catch (err: any) {
            console.error(err);
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('Connection error. Please ensure the backend is running on localhost:8000');
            } else {
                setError(err.message || "An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleOrgSubmit = async (e: React.FormEvent, skip: boolean = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/api/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: pendingGoogleToken,
                    org_name: skip ? "" : newOrgName
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Organization creation failed');
            }

            const data = await res.json();

            // Get User Details
            const userRes = await fetch('http://localhost:8000/api/me', {
                headers: { Authorization: `Bearer ${data.access_token}` }
            });
            const userData = await userRes.json();

            login(data.access_token, userData);
            navigate('/dashboard');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F9F8F6]">
            {/* Left Panel - Aesthetic (unchanged) */}
            <div className="hidden lg:flex w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="z-10">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm mb-6">
                        <span className="text-black font-serif font-bold text-lg">V</span>
                    </div>
                </div>

                <div className="z-10 max-w-md">
                    <h2 className="font-serif text-5xl mb-6">Governance only works when it's absolute.</h2>
                    <p className="text-gray-400 font-mono text-sm leading-relaxed">
                        The Veritas Protocol provides the necessary oversight for autonomous agents operating in high-stakes environments. Trust, but verify.
                    </p>
                </div>

                <div className="z-10 font-mono text-xs text-gray-500">
                    © 2026 SKLO INC. SYSTEM VERSION 2.1.0
                </div>

                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-gray-900 to-black rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF4D00] rounded-full mix-blend-overlay filter blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full"
                >
                    <div className="text-center mb-10">
                        <h3 className="font-serif text-3xl text-gray-900 mb-2">
                            {getTitle()}
                        </h3>
                        <p className="text-gray-500 text-sm">{getSubtitle()}</p>
                    </div>

                    {showOrgInput ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-sm shadow-xl border border-gray-100"
                        >
                            <h4 className="font-serif text-xl mb-4 text-center">One Last Thing</h4>
                            <p className="text-xs text-gray-500 mb-4 text-center">
                                To complete your account setup, please name your organization.
                            </p>
                            <form onSubmit={(e) => handleGoogleOrgSubmit(e)} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Organization Name</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none"
                                        value={newOrgName}
                                        onChange={(e) => setNewOrgName(e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-colors"
                                >
                                    {loading ? 'Creating...' : 'Create Organization & Account'}
                                </button>

                                <div className="text-center text-[10px] text-gray-400 my-2">- OR -</div>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={(e) => handleGoogleOrgSubmit(e, true)}
                                    className="w-full bg-gray-100 text-gray-600 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                >
                                    Skip (Join Existing Organization)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowOrgInput(false)}
                                    className="w-full text-xs text-gray-400 mt-2 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    ) : (

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Fields for Login & Signup */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Fields for Signup, Forgot, Reset */}
                            {(mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Organization Name for Signup */}
                            {mode === 'signup' && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id="createOrg"
                                            className="mr-2 h-4 w-4 bg-gray-100 border-gray-300 rounded text-[#FF4D00] focus:ring-[#FF4D00]"
                                            checked={createOrg}
                                            onChange={(e) => setCreateOrg(e.target.checked)}
                                        />
                                        <label htmlFor="createOrg" className="text-xs font-bold uppercase tracking-wider text-gray-500 select-none cursor-pointer">
                                            Create a new organization
                                        </label>
                                    </div>

                                    {createOrg && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                        >
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Organization Name</label>
                                            <input
                                                type="text"
                                                required={createOrg}
                                                className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors"
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                placeholder="e.g. Acme Corp"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Password for Login, Signup */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    {mode === 'signup' && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Must be 8+ characters with 1 uppercase and 1 number
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Reset Password specific fields */}
                            {mode === 'reset' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">OTP Code</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="6-digit code"
                                            className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors font-mono tracking-widest text-center"
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-white border border-gray-200 p-3 rounded-sm text-sm focus:border-[#FF4D00] focus:outline-none transition-colors"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Links for Login Mode */}
                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-gray-400 hover:text-gray-900">Forgot Password?</button>
                                </div>
                            )}

                            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                            {successMsg && <p className="text-green-600 text-xs text-center">{successMsg}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={12} />}
                                {mode === 'login' && 'Enter Console'}
                                {mode === 'signup' && 'Complete Registration'}
                                {mode === 'forgot' && 'Send Reset Code'}
                                {mode === 'reset' && 'Update Password'}
                            </button>

                            {/* Google Login Separator */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#F9F8F6] px-2 text-gray-500">Or continue with</span>
                                    </div>
                                </div>
                            )}

                            {/* Google Login Button */}
                            {(mode === 'login' || mode === 'signup') && (
                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={async (credentialResponse) => {
                                            try {
                                                const res = await fetch('http://localhost:8000/api/google-login', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ token: credentialResponse.credential })
                                                });

                                                if (res.status === 428) {
                                                    setPendingGoogleToken(credentialResponse.credential || '');
                                                    setShowOrgInput(true);
                                                    setSuccessMsg('');
                                                    return;
                                                }

                                                if (!res.ok) throw new Error("Google Login Failed");

                                                const data = await res.json();
                                                const userRes = await fetch('http://localhost:8000/api/me', {
                                                    headers: { Authorization: `Bearer ${data.access_token}` }
                                                });
                                                const userData = await userRes.json();

                                                login(data.access_token, userData);
                                                navigate('/dashboard');

                                            } catch (e: any) {
                                                console.error(e);
                                                setError("Google Sign-In failed.");
                                            }
                                        }}
                                        onError={() => {
                                            setError('Google Sign-In Failed');
                                        }}
                                        theme="filled_black"
                                        width="300"
                                    />
                                </div>
                            )}
                        </form>
                    )}

                    {/* Footer Nav */}
                    <div className="mt-8 text-center flex flex-col gap-2">
                        {mode === 'login' && (
                            <button onClick={() => setMode('signup')} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                                Don't have an account? Request access
                            </button>
                        )}
                        {(mode === 'signup' || mode === 'forgot') && (
                            <button onClick={() => setMode('login')} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                                Already have an account? Log in
                            </button>
                        )}
                        {mode === 'reset' && (
                            <button onClick={() => setMode('forgot')} className="text-xs text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center gap-1">
                                <ArrowLeft size={10} /> Resend OTP
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;

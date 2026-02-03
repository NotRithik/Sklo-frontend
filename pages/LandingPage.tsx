import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        navigate('/dashboard');
    }

    return (
        <div className="min-h-screen bg-[#F9F8F6] text-gray-900 font-sans selection:bg-[#FF4D00] selection:text-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-[#F9F8F6]/80">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm">
                        <span className="text-white font-serif font-bold text-lg">V</span>
                    </div>
                    <span className="text-xl font-serif tracking-tight font-bold">Veritas.</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-medium uppercase tracking-widest hover:text-[#FF4D00] transition-colors">
                        Login
                    </Link>
                    <Link
                        to="/login?mode=signup"
                        className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#FF4D00] transition-colors rounded-sm"
                    >
                        Get Access
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[70vh]">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-white mb-8">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] uppercase tracking-widest font-mono text-gray-500">System Online</span>
                        </div>

                        <h1 className="font-serif text-6xl md:text-8xl leading-[0.9] mb-8">
                            Truth in <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
                                Artificial Intelligence
                            </span>
                        </h1>

                        <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
                            The governance layer for your AI agents. Monitor hallucinations, enforce brand constraints, and manage your ground truth ledger in real-time.
                        </p>

                        <div className="flex gap-4">
                            <Link to="/login" className="group flex items-center gap-3 bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-all">
                                Launch Console <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="relative"
                    >
                        {/* Abstract UI Representation */}
                        <div className="relative z-10 bg-white rounded-lg shadow-2xl border border-gray-100 p-6 overflow-hidden">
                            <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="font-mono text-[10px] text-gray-400">OBSERVER_MODE_ACTIVE</div>
                            </div>

                            <div className="space-y-4 font-mono text-xs">
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-16 text-right">09:41:22</span>
                                    <span className="text-[#FF4D00]">[ALERT]</span>
                                    <span className="text-gray-800">Hallucination detected in session #4922</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-16 text-right">09:41:23</span>
                                    <span className="text-blue-600">[ACTION]</span>
                                    <span className="text-gray-800">Constraint "Brand Tone" enforced automatically.</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-16 text-right">09:41:25</span>
                                    <span className="text-green-600">[VERIFY]</span>
                                    <span className="text-gray-800">Fact retrieved from Ledger: "Product_ABV_6.5%"</span>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-50" />
                        </div>

                        {/* Glowing Backdrop */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-orange-100 to-gray-200 blur-3xl -z-10 opacity-50" />
                    </motion.div>
                </div>
            </main>

            {/* Features Stripe */}
            <section className="border-t border-gray-200 bg-white py-24 px-8 mt-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { icon: Database, title: "Immutable Ledger", desc: "Your ground truth database. Modifiable only by authorized humans." },
                        { icon: Shield, title: "Policy Engine", desc: "Hard constraints that prevent your AI from going rogue." },
                        { icon: CheckCircle, title: "Real-time Audits", desc: "Watch every conversation live with citations for every claim." }
                    ].map((feature, i) => (
                        <div key={i} className="group">
                            <feature.icon className="w-10 h-10 mb-6 text-gray-300 group-hover:text-[#FF4D00] transition-colors" />
                            <h3 className="font-serif text-2xl mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;

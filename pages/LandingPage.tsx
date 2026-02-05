import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, Database, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FloatingChatWidget } from '../components/FloatingChatWidget';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const arrowRef = useRef<HTMLDivElement>(null);
    const [arrowRotation, setArrowRotation] = useState(90); // Default pointing down

    useEffect(() => {
        const updateRotation = () => {
            if (!arrowRef.current) return;

            const arrowRect = arrowRef.current.getBoundingClientRect();
            const arrowCenterX = arrowRect.left + arrowRect.width / 2;
            const arrowCenterY = arrowRect.top + arrowRect.height / 2;

            // Widget is fixed at bottom-6 (24px) right-6 (24px)
            // Button is w-14 (56px) h-14 (56px)
            // Center is approx 24 + 28 = 52px from edges
            const widgetCenterX = window.innerWidth - 52;
            const widgetCenterY = window.innerHeight - 52;

            const deltaX = widgetCenterX - arrowCenterX;
            const deltaY = widgetCenterY - arrowCenterY;

            // standard atan2 returns angle from X axis (Right)
            // ArrowRight points Right by default, so 0deg is correct base
            const angleRad = Math.atan2(deltaY, deltaX);
            const angleDeg = angleRad * (180 / Math.PI);

            setArrowRotation(angleDeg);
        };

        window.addEventListener('scroll', updateRotation);
        window.addEventListener('resize', updateRotation);

        // Update immediately and after a short delay to account for layout shifts
        updateRotation();
        setTimeout(updateRotation, 100);

        return () => {
            window.removeEventListener('scroll', updateRotation);
            window.removeEventListener('resize', updateRotation);
        };
    }, []);

    if (isAuthenticated) {
        navigate('/dashboard');
    }

    return (
        <div className="min-h-screen bg-[#F9F8F6] text-gray-900 font-sans selection:bg-[#FF4D00] selection:text-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-[#F9F8F6]/80">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm">
                        <span className="text-white font-serif font-bold text-lg">S</span>
                    </div>
                    <span className="text-xl font-serif tracking-tight font-bold">Sklo.</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-medium uppercase tracking-widest hover:text-[#FF4D00] transition-colors">
                        Sign In
                    </Link>
                    <Link
                        to="/login?mode=signup"
                        className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#FF4D00] transition-colors rounded-sm"
                    >
                        Get Started
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
                            Chatbots That Work <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
                                While You Don't
                            </span>
                        </h1>

                        <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
                            Build a chatbot that answers customer questions, qualifies leads, and answers FAQs automatically. No coding required.
                        </p>

                        <div className="flex gap-4">
                            <Link to="/login" className="group flex items-center gap-3 bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-all">
                                Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="relative flex flex-col items-center justify-center text-center p-8"
                    >
                        <div className="relative z-10">
                            <h3 className="font-serif text-3xl mb-4">Try it yourself</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                See how Sklo handles customer queries in real-time. Click the chat bubble below to start a conversation.
                            </p>

                            <motion.div
                                ref={arrowRef}
                                animate={{
                                    y: [0, 10, 0],
                                    rotate: arrowRotation
                                }}
                                transition={{
                                    y: { repeat: Infinity, duration: 2 },
                                    rotate: { type: "spring", stiffness: 50 }
                                }}
                                className="text-[#FF4D00] inline-block"
                            >
                                <ArrowRight className="w-8 h-8" />
                            </motion.div>
                        </div>

                        {/* Glowing Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-gray-50 blur-3xl -z-10 rounded-full opacity-70" />
                    </motion.div>
                </div>
            </main>

            {/* Features Stripe */}
            <section className="border-t border-gray-200 bg-white py-24 px-8 mt-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { icon: Database, title: "Your Knowledge Base", desc: "The facts and answers your chatbot should know. You control what it says." },
                        { icon: Shield, title: "Conversation Rules", desc: "Set boundaries so your chatbot stays on message and on brand." },
                        { icon: CheckCircle, title: "Live Conversation View", desc: "See how your chatbot helps customers in real-time. Jump in when needed." }
                    ].map((feature, i) => (
                        <div key={i} className="group">
                            <feature.icon className="w-10 h-10 mb-6 text-gray-300 group-hover:text-[#FF4D00] transition-colors" />
                            <h3 className="font-serif text-2xl mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Landing Page Chatbot */}
            <FloatingChatWidget
                apiKey={import.meta.env.VITE_LANDING_CHATBOT_API_KEY}
                botName="Sklo Assistant"
            />
        </div>
    );
};

export default LandingPage;

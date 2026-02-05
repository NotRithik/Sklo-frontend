import React, { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { API_BASE } from '../services/api';
import { Bot, ChevronDown, Check, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Chatbot {
    id: string;
    name: string;
    description?: string;
    preview_api_key?: string;
}

interface ChatbotContextType {
    chatbots: Chatbot[];
    selectedChatbot: Chatbot | null;
    setSelectedChatbot: (chatbot: Chatbot) => void;
    loading: boolean;
    refresh: () => void;
}

export const ChatbotContext = createContext<ChatbotContextType | null>(null);

export const useChatbot = () => {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error('useChatbot must be used within a ChatbotProvider');
    }
    return context;
};

interface ChatbotProviderProps {
    children: ReactNode;
    authToken: string;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children, authToken }) => {
    const [chatbots, setChatbots] = useState<Chatbot[]>([]);
    const [selectedChatbot, setSelectedChatbotState] = useState<Chatbot | null>(null);
    const [loading, setLoading] = useState(true);

    const loadChatbots = async () => {
        if (!authToken) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/chatbots`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChatbots(data);

                // Restore from localStorage or select first
                const savedId = localStorage.getItem('selectedChatbotId');
                const saved = data.find((c: Chatbot) => c.id === savedId);
                setSelectedChatbotState(saved || data[0] || null);
            }
        } catch (err) {
            console.error('Failed to load chatbots:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChatbots();
    }, [authToken]);

    const setSelectedChatbot = (chatbot: Chatbot) => {
        setSelectedChatbotState(chatbot);
        localStorage.setItem('selectedChatbotId', chatbot.id);
    };

    return (
        <ChatbotContext.Provider value={{
            chatbots,
            selectedChatbot,
            setSelectedChatbot,
            loading,
            refresh: loadChatbots
        }}>
            {children}
        </ChatbotContext.Provider>
    );
};

// Dropdown Selector Component
export const ChatbotSelector: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => {
    const { chatbots, selectedChatbot, setSelectedChatbot, loading } = useChatbot();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                <Loader2 size={14} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Loading...</span>
            </div>
        );
    }

    if (chatbots.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Bot size={14} className="text-gray-400" />
                <span className="text-sm text-gray-400">No chatbots</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <Bot size={12} className="text-gray-500" />
                    </div>
                    <span className="truncate">{selectedChatbot?.name || 'Select Chatbot'}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute left-0 top-full mt-2 w-full bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top flex flex-col py-1"
                    >

                        <div className="max-h-64 overflow-y-auto py-1">
                            {chatbots.map((chatbot) => (
                                <button
                                    key={chatbot.id}
                                    onClick={() => {
                                        setSelectedChatbot(chatbot);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${selectedChatbot?.id === chatbot.id ? 'bg-[#FF4D00]/5 text-[#FF4D00] font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selectedChatbot?.id === chatbot.id ? 'bg-[#FF4D00]/10' : 'bg-gray-100'}`}>
                                            <Bot size={12} className={selectedChatbot?.id === chatbot.id ? 'text-[#FF4D00]' : 'text-gray-400'} />
                                        </div>
                                        <span className="truncate">{chatbot.name}</span>
                                    </div>
                                    {selectedChatbot?.id === chatbot.id && (
                                        <Check size={14} className="flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>


                        {/* New Chatbot Button */}
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onCreate?.();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#FF4D00] transition-colors"
                            >
                                <Plus size={12} />
                                Create New Chatbot
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ChatbotSelector;

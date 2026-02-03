import React, { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { API_BASE } from '../services/api';
import { Bot, ChevronDown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Chatbot {
    id: string;
    name: string;
    description?: string;
}

interface ChatbotContextType {
    chatbots: Chatbot[];
    selectedChatbot: Chatbot | null;
    setSelectedChatbot: (chatbot: Chatbot) => void;
    loading: boolean;
    refresh: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | null>(null);

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
export const ChatbotSelector: React.FC = () => {
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
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-[#FF4D00] transition-colors group"
            >
                <Bot size={14} className="text-gray-500 group-hover:text-[#FF4D00]" />
                <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                    {selectedChatbot?.name || 'Select Chatbot'}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                                Active Chatbot
                            </p>
                            <p className="text-[10px] text-gray-400 px-2">
                                All data is scoped to this bot
                            </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                            {chatbots.map((chatbot) => (
                                <button
                                    key={chatbot.id}
                                    onClick={() => {
                                        setSelectedChatbot(chatbot);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${selectedChatbot?.id === chatbot.id ? 'bg-orange-50' : ''
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedChatbot?.id === chatbot.id
                                        ? 'bg-[#FF4D00] text-white'
                                        : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <Bot size={14} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className="text-sm font-medium text-gray-900 block truncate">
                                            {chatbot.name}
                                        </span>
                                        {chatbot.description && (
                                            <span className="text-xs text-gray-400 truncate block">
                                                {chatbot.description}
                                            </span>
                                        )}
                                    </div>
                                    {selectedChatbot?.id === chatbot.id && (
                                        <Check size={16} className="text-[#FF4D00] flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatbotSelector;

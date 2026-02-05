import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useChatbot } from './ChatbotSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE } from '../services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const FloatingChatWidget = () => {
    const { selectedChatbot } = useChatbot();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting when opened or chatbot changes
    useEffect(() => {
        if (isOpen && messages.length === 0 && selectedChatbot) {
            setMessages([
                {
                    id: 'init',
                    role: 'assistant',
                    content: `Hi there! I'm ${selectedChatbot.name}. How can I help you today?`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen, selectedChatbot]);

    // Clear chat when bot changes
    useEffect(() => {
        setMessages([]);
        setSessionId(null);
    }, [selectedChatbot?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || !selectedChatbot) return;

        // Message to send
        const messageText = inputValue.trim();

        // Ensure session ID
        let currentSessionId = sessionId;
        if (!currentSessionId) {
            currentSessionId = `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            setSessionId(currentSessionId);
        }

        // Add user message immediately
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const apiKey = selectedChatbot.preview_api_key;
            if (!apiKey) {
                throw new Error("Chatbot has no preview API key");
            }

            const response = await fetch(`${API_BASE}/v1/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    message: messageText,
                    session_id: currentSessionId
                })
            });

            if (!response.ok) throw new Error('API request failed');
            if (!response.body) throw new Error('No response body');

            // Hide typing indicator as soon as stream starts
            setIsTyping(false);

            // Placeholder for assistant message
            const botMsgId = (Date.now() + 1).toString();
            const botMsg: Message = {
                id: botMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep partial line

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.trim().slice(6));
                            if (data.chunk) {
                                accumulatedContent += data.chunk;
                                setMessages(prev => prev.map(m =>
                                    m.id === botMsgId ? { ...m, content: accumulatedContent } : m
                                ));
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            setIsTyping(false);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error connecting to the chatbot.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!selectedChatbot) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-16 right-0 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{selectedChatbot.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-white/70">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMessages([])}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                                    title="Reset Chat"
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`
                                        w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                                        ${msg.role === 'user' ? 'bg-gray-200 text-gray-700' : 'bg-black text-white'}
                                    `}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`
                                        max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-gray-200 text-gray-900 rounded-tr-none'
                                            : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-none'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center">
                                        <Bot size={14} />
                                    </div>
                                    <div className="bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#FF4D00] transition-colors disabled:opacity-50 disabled:hover:bg-black"
                                >
                                    {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </div>
                            <div className="mt-2 text-center">
                                <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                    Powered by <span className="font-bold text-gray-500">Sklo</span> <Sparkles size={8} />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                    hover:scale-110 active:scale-95
                    ${isOpen ? 'bg-gray-200 text-black rotate-90' : 'bg-black text-white hover:bg-[#FF4D00]'}
                `}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

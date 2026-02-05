import React, { useState, useEffect } from 'react';
import {
    Bot,
    Plus,
    Key,
    Copy,
    Trash2,
    Check,
    X,
    Loader2,
    Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatbot } from './ChatbotSelector';
import { ConfirmDialog } from './ConfirmDialog';
import { API_BASE } from '../services/api';

// Types
interface Chatbot {
    id: string;
    name: string;
    description?: string;
    model?: string;
    created_at?: string;
}

interface APIKey {
    id: string;
    key_prefix: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

interface ChatbotManagerProps {
    authToken: string;
    onSelectChatbot: (chatbot: Chatbot) => void;
    selectedChatbotId?: string;
    startCreating?: boolean;
    onCloseCreate?: () => void;
}

// API_BASE imported from services/api

const fetchWithAuth = async (url: string, token: string, options: RequestInit = {}) => {
    return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });
};

// Main Component - Just chatbot CRUD and API key management
export const ChatbotManager: React.FC<ChatbotManagerProps> = ({
    authToken,
    onSelectChatbot,
    selectedChatbotId,
    startCreating,
    onCloseCreate
}) => {
    const [chatbots, setChatbots] = useState<Chatbot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Initial open if startCreating is true
    useEffect(() => {
        if (startCreating) {
            setShowCreateModal(true);
        }
    }, [startCreating]);

    // Handle modal close
    const handleCloseCreate = () => {
        setShowCreateModal(false);
        onCloseCreate?.();
    };
    const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
    const [expandedBot, setExpandedBot] = useState<string | null>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Get context refresh function to sync the dropdown selector
    const chatbotContext = useChatbot();

    useEffect(() => {
        loadChatbots();
    }, [authToken]);

    const loadChatbots = async () => {
        try {
            setLoading(true);
            const res = await fetchWithAuth('/api/chatbots', authToken);
            if (res.ok) {
                const data = await res.json();
                setChatbots(data);
            }
        } catch (err) {
            console.error('Failed to load chatbots:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChatbot = async (name: string, description: string) => {
        try {
            const res = await fetchWithAuth('/api/chatbots', authToken, {
                method: 'POST',
                body: JSON.stringify({ name, description }),
            });
            if (res.ok) {
                const newBot = await res.json();
                loadChatbots();
                chatbotContext.refresh(); // Sync dropdown selector
                chatbotContext.setSelectedChatbot(newBot); // Switch to new bot
                handleCloseCreate();
            }
        } catch (err) {
            console.error('Failed to create chatbot:', err);
        }
    };

    const handleUpdateChatbot = async (id: string, name: string, description: string) => {
        try {
            const res = await fetchWithAuth(`/api/chatbots/${id}`, authToken, {
                method: 'PATCH',
                body: JSON.stringify({ name, description }),
            });
            if (res.ok) {
                loadChatbots();
                chatbotContext.refresh(); // Sync dropdown selector
                setEditingChatbot(null);
            }
        } catch (err) {
            console.error('Failed to update chatbot:', err);
        }
    };

    const handleDeleteChatbot = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Chatbot',
            message: 'Delete this chatbot? All facts, constraints, and API keys will be permanently deleted.',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await fetchWithAuth(`/api/chatbots/${id}`, authToken, { method: 'DELETE' });
                    loadChatbots();
                    chatbotContext.refresh();
                } catch (err) {
                    console.error('Failed to delete chatbot:', err);
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4D00]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">My Chatbots</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage your AI agents. Select a chatbot to edit its facts and constraints.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-[#FF4D00] transition-colors"
                >
                    <Plus size={16} />
                    New Chatbot
                </button>
            </div>

            {/* Chatbot List */}
            <div className="space-y-4">
                {chatbots.map((chatbot) => (
                    <div
                        key={chatbot.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                    >
                        {/* Chatbot Row */}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Bot size={24} className="text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">{chatbot.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {chatbot.description || 'No description'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setExpandedBot(expandedBot === chatbot.id ? null : chatbot.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${expandedBot === chatbot.id
                                        ? 'bg-[#FF4D00] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Key size={12} />
                                    API Keys
                                </button>
                                <button
                                    onClick={() => setEditingChatbot(chatbot)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteChatbot(chatbot.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* API Keys Section */}
                        <AnimatePresence>
                            {expandedBot === chatbot.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden border-t border-gray-100"
                                >
                                    <div className="p-5 bg-gray-50">
                                        <APIKeyPanel authToken={authToken} chatbotId={chatbot.id} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {chatbots.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <Bot size={64} className="mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No chatbots yet</h3>
                        <p className="text-sm">Create your first chatbot to get started</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <ChatbotModal
                isOpen={showCreateModal}
                onClose={handleCloseCreate}
                onSave={handleCreateChatbot}
                title="Create New Chatbot"
            />

            {/* Edit Modal */}
            <ChatbotModal
                isOpen={!!editingChatbot}
                onClose={() => setEditingChatbot(null)}
                onSave={(name, desc) => editingChatbot && handleUpdateChatbot(editingChatbot.id, name, desc)}
                title="Edit Chatbot"
                initialName={editingChatbot?.name}
                initialDescription={editingChatbot?.description}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

// API Key Panel
const APIKeyPanel: React.FC<{ authToken: string; chatbotId: string }> = ({ authToken, chatbotId }) => {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        keyId: string;
    }>({ isOpen: false, keyId: '' });

    useEffect(() => { loadKeys(); }, [chatbotId]);

    const loadKeys = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`/api/chatbots/${chatbotId}/api-keys`, authToken);
            if (res.ok) setKeys(await res.json());
        } finally { setLoading(false); }
    };

    const createKey = async () => {
        try {
            const res = await fetchWithAuth(`/api/chatbots/${chatbotId}/api-keys`, authToken, {
                method: 'POST',
                body: JSON.stringify({ name: newKeyName || 'API Key' }),
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns tuple: [full_key, key_info]
                const fullKey = Array.isArray(data) ? data[0] : data.key;
                setNewKey(fullKey);
                setNewKeyName('');
                loadKeys();
            }
        } catch (err) { console.error(err); }
    };

    const deleteKey = async (keyId: string) => {
        setConfirmDialog({ isOpen: true, keyId });
    };

    const confirmDeleteKey = async () => {
        const keyId = confirmDialog.keyId;
        setConfirmDialog({ isOpen: false, keyId: '' });
        await fetchWithAuth(`/api/chatbots/${chatbotId}/api-keys/${keyId}`, authToken, { method: 'DELETE' });
        loadKeys();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /></div>;

    return (
        <div>
            {/* New Key Alert */}
            {newKey && (
                <div className="bg-green-50 border border-green-200 p-3 mb-4 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-semibold text-sm">🔑 Key Created!</span>
                        <button onClick={() => setNewKey(null)}><X size={14} className="text-green-600" /></button>
                    </div>
                    <p className="text-xs text-green-600 mb-2">Copy now - won't be shown again!</p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-200">
                        <code className="flex-1 text-xs font-mono break-all">{newKey}</code>
                        <button onClick={() => copyToClipboard(newKey)} className="p-1.5 bg-green-100 hover:bg-green-200 rounded">
                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-green-600" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Create New */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Key name (optional)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:border-[#FF4D00] focus:outline-none"
                />
                <button onClick={createKey} className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-[#FF4D00] rounded flex items-center gap-2">
                    <Plus size={14} />
                    Generate
                </button>
            </div>

            {/* Key List */}
            {keys.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No API keys yet</p>
            ) : (
                <div className="space-y-2">
                    {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                            <div>
                                <code className="text-sm font-mono text-gray-600">{key.key_prefix}...</code>
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${key.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {key.is_active ? 'Active' : 'Revoked'}
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">{key.name}</p>
                            </div>
                            <button onClick={() => deleteKey(key.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Dialog for API Key Revoke */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Revoke API Key"
                message="Are you sure you want to revoke this API key? Applications using this key will stop working."
                confirmText="Revoke"
                variant="warning"
                onConfirm={confirmDeleteKey}
                onCancel={() => setConfirmDialog({ isOpen: false, keyId: '' })}
            />
        </div>
    );
};

// Chatbot Modal (Create/Edit)
const ChatbotModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
    title: string;
    initialName?: string;
    initialDescription?: string;
}> = ({ isOpen, onClose, onSave, title, initialName = '', initialDescription = '' }) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);

    useEffect(() => {
        setName(initialName);
        setDescription(initialDescription);
    }, [initialName, initialDescription, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name, description);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl text-gray-900">{title}</h3>
                    <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-900" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Chatbot" className="w-full px-4 py-3 border border-gray-200 focus:border-[#FF4D00] focus:outline-none" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this chatbot do?" className="w-full px-4 py-3 border border-gray-200 focus:border-[#FF4D00] focus:outline-none resize-none h-24" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-black text-white hover:bg-[#FF4D00]">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatbotManager;

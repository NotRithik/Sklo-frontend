import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CreateOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose }) => {
    const { switchOrganization } = useAuth();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                // Close modal
                onClose();
                // Switch to new org
                await switchOrganization(data.id);
                // Reset form
                setName('');
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to create organization');
            }

        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                        <Building size={20} className="text-[#FF4D00]" />
                        Create Organization
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Corp, Engineering Team"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-colors outline-none"
                            autoFocus
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            You will be the administrator of this new organization.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-[#FF4D00] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            Create Organization
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

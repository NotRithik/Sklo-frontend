/**
 * Reusable Confirmation Dialog Component
 * Replaces browser confirm() with a styled modal matching the app theme
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    const variantStyles = {
        danger: {
            icon: 'bg-red-500/20 text-red-400',
            button: 'bg-red-600 hover:bg-red-700 text-white',
            border: 'border-red-500/30'
        },
        warning: {
            icon: 'bg-yellow-500/20 text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            border: 'border-yellow-500/30'
        },
        info: {
            icon: 'bg-blue-500/20 text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
            border: 'border-blue-500/30'
        }
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onCancel}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`
                            bg-[#1a1a1a] border ${styles.border} rounded-xl 
                            shadow-2xl max-w-md w-full overflow-hidden
                        `}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${styles.icon}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                                <p className="text-gray-300 whitespace-pre-line">{message}</p>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 p-4 border-t border-gray-700/50 bg-black/20">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-600 
                                        text-gray-300 hover:bg-gray-700/50 hover:text-white
                                        transition-all font-medium"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 px-4 py-2.5 rounded-lg ${styles.button}
                                        transition-all font-medium shadow-lg`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Hook for easier usage
export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const confirm = (options: {
        title: string;
        message: string;
        confirmText?: string;
        variant?: 'danger' | 'warning' | 'info';
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                ...options,
                onConfirm: () => {
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                }
            });
        });
    };

    const close = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const ConfirmDialogComponent = () => (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            title={dialogState.title}
            message={dialogState.message}
            confirmText={dialogState.confirmText}
            variant={dialogState.variant}
            onConfirm={dialogState.onConfirm}
            onCancel={close}
        />
    );

    return { confirm, ConfirmDialogComponent, close };
};

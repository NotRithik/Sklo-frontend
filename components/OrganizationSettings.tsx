import React, { useState, useEffect } from 'react';
import {
    Settings,
    Users,
    Crown,
    UserMinus,
    UserPlus,
    Save,
    Loader2,
    X,
    Shield,
    Eye,
    Edit3,
    Check,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from './ConfirmDialog';
import { API_BASE } from '../services/api';

interface Organization {
    id: string;
    name: string;
    created_at: string;
    member_count: number;
    user_role: string;
}

interface Member {
    username: string;
    email: string;
    role: string;
    is_active: boolean;
}

interface OrganizationSettingsProps {
    authToken: string;
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

// Role badge component
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const styles: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-700 border-purple-200',
        member: 'bg-blue-100 text-blue-700 border-blue-200',
        viewer: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    const icons: Record<string, React.ReactNode> = {
        admin: <Crown size={10} />,
        member: <Edit3 size={10} />,
        viewer: <Eye size={10} />
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${styles[role] || styles.viewer}`}>
            {icons[role]}
            {role}
        </span>
    );
};

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({ authToken }) => {
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('member');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        variant: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', variant: 'danger', onConfirm: () => { } });

    const isAdmin = org?.user_role === 'admin';

    useEffect(() => {
        loadData();
    }, [authToken]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orgRes, membersRes] = await Promise.all([
                fetchWithAuth('/api/organization', authToken),
                fetchWithAuth('/api/organization/members', authToken)
            ]);

            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrg(orgData);
                setOrgName(orgData.name);
            }

            if (membersRes.ok) {
                const membersData = await membersRes.json();
                setMembers(membersData);
            }
        } catch (err) {
            console.error('Failed to load organization data:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveOrgName = async () => {
        if (!orgName.trim() || orgName === org?.name) return;

        try {
            setSaving(true);
            const res = await fetchWithAuth('/api/organization', authToken, {
                method: 'PATCH',
                body: JSON.stringify({ name: orgName }),
            });

            if (res.ok) {
                setSuccess('Organization name updated!');
                setOrg(prev => prev ? { ...prev, name: orgName } : null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to update');
            }
        } catch (err) {
            setError('Failed to update organization');
        } finally {
            setSaving(false);
        }
    };

    const addMember = async () => {
        if (!newMemberEmail.trim()) return;

        try {
            setError('');
            const res = await fetchWithAuth('/api/organization/members', authToken, {
                method: 'POST',
                body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
            });

            if (res.ok) {
                setSuccess('Member added successfully!');
                setNewMemberEmail('');
                setNewMemberRole('member');
                setShowAddMember(false);
                loadData();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to add member');
            }
        } catch (err) {
            setError('Failed to add member');
        }
    };

    const updateRole = async (username: string, newRole: string) => {
        try {
            setError('');
            const res = await fetchWithAuth(`/api/organization/members/${username}/role`, authToken, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                setMembers(prev => prev.map(m =>
                    m.username === username ? { ...m, role: newRole } : m
                ));
                setSuccess('Role updated!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to update role');
            }
        } catch (err) {
            setError('Failed to update role');
        }
    };

    const removeMember = async (username: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Remove Member',
            message: `Remove ${username} from the organization? They will lose access to all chatbots and data.`,
            confirmText: 'Remove',
            variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    setError('');
                    const res = await fetchWithAuth(`/api/organization/members/${username}`, authToken, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        setMembers(prev => prev.filter(m => m.username !== username));
                        setSuccess('Member removed!');
                        setTimeout(() => setSuccess(''), 3000);
                    } else {
                        const data = await res.json();
                        setError(data.detail || 'Failed to remove member');
                    }
                } catch (err) {
                    setError('Failed to remove member');
                }
            }
        });
    };

    const deleteOrg = async () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Organization',
            message: 'Are you absolutely sure?\n\nThis action cannot be undone. This will permanently delete the organization, all chatbots, facts, and team memberships.',
            confirmText: 'Delete Organization',
            variant: 'danger',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await fetchWithAuth('/api/organization', authToken, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        window.location.reload();
                    } else {
                        const data = await res.json();
                        setError(data.detail || 'Failed to delete organization');
                    }
                } catch (err) {
                    setError('Failed to delete organization');
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
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <Settings size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-gray-900">Organization Settings</h1>
                        <p className="text-sm text-gray-500">
                            Manage your organization and team members
                        </p>
                    </div>
                </div>

                {/* Role indicator */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Your role:</span>
                    <RoleBadge role={org?.user_role || 'member'} />
                </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2"
                    >
                        <AlertTriangle size={14} />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded flex items-center gap-2"
                    >
                        <Check size={14} />
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Organization Details */}
            <div className="bg-white border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={18} />
                    Organization Details
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Organization Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                disabled={!isAdmin}
                                className="flex-1 px-4 py-2 border border-gray-200 focus:border-[#FF4D00] focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            {isAdmin && (
                                <button
                                    onClick={saveOrgName}
                                    disabled={saving || orgName === org?.name}
                                    className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-[#FF4D00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save
                                </button>
                            )}
                        </div>
                        {!isAdmin && (
                            <p className="text-xs text-gray-400 mt-1">Only admins can edit organization settings</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <span className="text-xs text-gray-400 block">Organization ID</span>
                            <code className="text-sm font-mono text-gray-600">{org?.id}</code>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block">Created</span>
                            <span className="text-sm text-gray-600">
                                {org?.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users size={18} />
                        Team Members ({members.length})
                    </h2>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddMember(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs font-medium hover:bg-[#FF4D00] transition-colors"
                        >
                            <UserPlus size={12} />
                            Add Member
                        </button>
                    )}
                </div>

                {/* Add Member Form */}
                <AnimatePresence>
                    {showAddMember && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="email"
                                        placeholder="User email address"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:border-[#FF4D00] focus:outline-none"
                                    />
                                    <select
                                        value={newMemberRole}
                                        onChange={(e) => setNewMemberRole(e.target.value)}
                                        className="px-3 py-2 border border-gray-200 text-sm focus:border-[#FF4D00] focus:outline-none"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        onClick={addMember}
                                        className="px-4 py-2 bg-[#FF4D00] text-white text-sm font-medium hover:bg-[#cc3d00] transition-colors"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddMember(false)}
                                        className="px-2 py-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    User must already have an account. Roles: <strong>Admin</strong> (full access), <strong>Member</strong> (edit chatbots), <strong>Viewer</strong> (read-only)
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Member List */}
                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member.username}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-600">
                                        {member.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{member.username}</span>
                                        <RoleBadge role={member.role} />
                                    </div>
                                    <span className="text-xs text-gray-500">{member.email}</span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <select
                                        value={member.role}
                                        onChange={(e) => updateRole(member.username, e.target.value)}
                                        className="px-2 py-1 border border-gray-200 text-xs rounded focus:outline-none focus:border-[#FF4D00]"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        onClick={() => removeMember(member.username)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="Remove member"
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No team members yet</p>
                        </div>
                    )}
                </div>

                {/* Role Legend */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Permissions</p>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                        <div>
                            <RoleBadge role="admin" />
                            <p className="mt-1">Full access, manage members</p>
                        </div>
                        <div>
                            <RoleBadge role="member" />
                            <p className="mt-1">Create/edit chatbots & facts</p>
                        </div>
                        <div>
                            <RoleBadge role="viewer" />
                            <p className="mt-1">View only, no edits</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            {isAdmin && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} /> Danger Zone
                    </h2>
                    <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-red-900">Delete Organization</h3>
                            <p className="text-xs text-red-700 mt-1">
                                Permanently delete this organization and all its data. This action is irreversible.
                            </p>
                        </div>
                        <button
                            onClick={deleteOrg}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors rounded"
                        >
                            Delete Organization
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default OrganizationSettings;

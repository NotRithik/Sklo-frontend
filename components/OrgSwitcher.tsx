import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Building, Check } from 'lucide-react';

export const OrgSwitcher = ({ onCreateOrg }: { onCreateOrg?: () => void }) => {
    const { user, organizations, switchOrganization } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSwitch = async (orgId: string) => {
        setIsOpen(false);
        await switchOrganization(orgId);
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20"
            >
                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                    <Building size={12} className="text-gray-500" />
                </div>
                <span className="max-w-[120px] truncate">{user.company || "Select Org"}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-lg shadow-2xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom">
                    <div className="px-3 py-2 border-b border-gray-50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizations</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSwitch(org.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${user.org_id === org.id ? 'bg-[#FF4D00]/5 text-[#FF4D00] font-medium' : 'text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${user.org_id === org.id ? 'bg-[#FF4D00]/10' : 'bg-gray-100'}`}>
                                        <Building size={12} className={user.org_id === org.id ? 'text-[#FF4D00]' : 'text-gray-400'} />
                                    </div>
                                    <span className="truncate">{org.name}</span>
                                </div>
                                {user.org_id === org.id && <Check size={14} />}
                            </button>
                        ))}
                        {organizations.length === 0 && (
                            <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                No other organizations found.
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-50 p-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onCreateOrg?.();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-xs">
                            + Join or Create Organization
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

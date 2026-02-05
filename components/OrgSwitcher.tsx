import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Building, Check, Plus } from 'lucide-react';

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
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <Building size={12} className="text-gray-500" />
                    </div>
                    <span className="truncate">{user.company || "Select Org"}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top flex flex-col py-1">

                    <div className="max-h-[300px] overflow-y-auto py-1">
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSwitch(org.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 ${(user.org_id === org.id || user.company === org.name) ? 'bg-[#FF4D00]/5 text-[#FF4D00] font-medium' : 'text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${(user.org_id === org.id || user.company === org.name) ? 'bg-[#FF4D00]/10' : 'bg-gray-100'}`}>
                                        <Building size={12} className={(user.org_id === org.id || user.company === org.name) ? 'text-[#FF4D00]' : 'text-gray-400'} />
                                    </div>
                                    <span className="truncate">{org.name}</span>
                                </div>
                                {(user.org_id === org.id || user.company === org.name) && <Check size={14} className="flex-shrink-0" />}
                            </button>
                        ))}
                        {organizations.length === 0 && (
                            <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                No other organizations found.
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onCreateOrg?.();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#FF4D00] transition-colors"
                        >
                            <Plus size={12} />
                            Create Organization
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../services/api';

interface Organization {
    id: string;
    name: string;
    role: string;
    is_primary: boolean;
}

interface OrgContextType {
    organizations: Organization[];
    activeOrg: Organization | null;
    setActiveOrg: (org: Organization) => void;
    loading: boolean;
    refreshOrgs: () => void;
}

const OrgContext = createContext<OrgContextType | null>(null);

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error('useOrg must be used within an OrgProvider');
    }
    return context;
};

interface OrgProviderProps {
    children: ReactNode;
}

export const OrgProvider: React.FC<OrgProviderProps> = ({ children }) => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    const loadOrgs = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/me/organizations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const orgs = await res.json();
                setOrganizations(orgs);

                // Restore last active org from localStorage or use primary
                const savedOrgId = localStorage.getItem('activeOrgId');
                const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);
                const primaryOrg = orgs.find((o: Organization) => o.is_primary);

                setActiveOrgState(savedOrg || primaryOrg || orgs[0] || null);
            }
        } catch (err) {
            console.error('Failed to load organizations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrgs();
    }, []);

    const setActiveOrg = (org: Organization) => {
        setActiveOrgState(org);
        localStorage.setItem('activeOrgId', org.id);
    };

    return (
        <OrgContext.Provider value={{
            organizations,
            activeOrg,
            setActiveOrg,
            loading,
            refreshOrgs: loadOrgs
        }}>
            {children}
        </OrgContext.Provider>
    );
};

export default OrgProvider;

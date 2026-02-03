import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    username: string;
    email: string | null;
    company: string;
    org_id: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    organizations: Organization[];
    login: (token: string, userData: User) => void;
    logout: () => void;
    switchOrganization: (orgId: string) => Promise<void>;
    isAuthenticated: boolean;
    checkAuth: () => Promise<void>;
    isLoading: boolean;
}

interface Organization {
    id: string;
    name: string;
    role: string;
    is_primary: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const [organizations, setOrganizations] = useState<Organization[]>([]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // 1. Get User Profile (scoped to current org token)
                const res = await fetch('http://localhost:8000/api/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);

                    // 2. Fetch Organizations List
                    const orgRes = await fetch('http://localhost:8000/api/users/me/orgs', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (orgRes.ok) {
                        const orgData = await orgRes.json();
                        setOrganizations(orgData);
                    }
                } else {
                    logout();
                }
            } catch (e) {
                logout();
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    const switchOrganization = async (targetOrgId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:8000/api/auth/switch-org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ target_org_id: targetOrgId })
            });

            if (res.ok) {
                const data = await res.json();
                // Update token and user context
                localStorage.setItem('token', data.access_token);
                // Refresh auth state to get new org details
                await checkAuth();
            } else {
                console.error("Failed to switch organization");
            }
        } catch (e) {
            console.error("Error switching organization", e);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Session Management logic
    useEffect(() => {
        if (!user) return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log("Session expired due to inactivity.");
                logout();
            }, SESSION_TIMEOUT);
        };

        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer(); // Initialize timer

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [user]);

    const login = async (token: string, userData: User) => {
        localStorage.setItem('token', token);
        setUser(userData);

        // Fetch organizations immediately after login
        try {
            const orgRes = await fetch('http://localhost:8000/api/users/me/orgs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrganizations(orgData);
            }
        } catch (e) {
            console.error('Failed to fetch organizations after login:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, organizations, login, logout, switchOrganization, isAuthenticated: !!user, checkAuth, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

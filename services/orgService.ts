/**
 * Organization Service
 * API calls for organization management
 */
import { api, apiFetch } from './api';

export interface Organization {
    id: string;
    name: string;
    role: string;
    is_primary: boolean;
}

export interface OrganizationDetails {
    id: string;
    name: string;
    created_at: string;
    member_count: number;
    user_role: string;
}

export interface Member {
    username: string;
    email: string;
    role: string;
    is_active: boolean;
}

export const orgService = {
    /**
     * Get list of organizations the user belongs to
     */
    getMyOrganizations: () => api.get<Organization[]>('/api/users/me/orgs'),

    /**
     * Get current organization details
     */
    getCurrentOrg: () => api.get<OrganizationDetails>('/api/organization'),

    /**
     * Create a new organization
     */
    create: (name: string) => api.post<Organization>('/api/organizations', { name }),

    /**
     * Update organization name
     */
    update: (name: string) => api.patch<{ status: string }>('/api/organization', { name }),

    /**
     * Delete current organization
     */
    delete: () => api.delete<{ status: string; message: string }>('/api/organization'),

    /**
     * Switch to a different organization
     */
    switchOrg: async (targetOrgId: string): Promise<{ access_token: string; org_id: string }> => {
        const result = await api.post<{ access_token: string; org_id: string }>(
            '/api/auth/switch-org',
            { target_org_id: targetOrgId }
        );
        // Update stored token
        localStorage.setItem('token', result.access_token);
        return result;
    },

    /**
     * Get organization members
     */
    getMembers: () => api.get<Member[]>('/api/organization/members'),

    /**
     * Add a member to the organization
     */
    addMember: (email: string, role: string = 'member') =>
        api.post<Member>('/api/organization/members', { email, role }),

    /**
     * Update a member's role
     */
    updateMemberRole: (username: string, role: string) =>
        api.patch<{ status: string }>(`/api/organization/members/${username}/role`, { role }),

    /**
     * Remove a member from the organization
     */
    removeMember: (username: string) =>
        api.delete<{ status: string }>(`/api/organization/members/${username}`),
};

export default orgService;

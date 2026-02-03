/**
 * Chatbot Service
 * API calls for chatbot management
 */
import { api } from './api';

export interface Chatbot {
    id: string;
    name: string;
    description?: string;
    system_prompt?: string;
    model?: string;
    org_id: string;
}

export interface APIKey {
    id: string;
    name: string;
    key_prefix: string;
    is_active: boolean;
    created_at: string;
}

export interface ChatbotCreateData {
    name: string;
    description?: string;
    system_prompt?: string;
    model?: string;
}

export const chatbotService = {
    /**
     * List all chatbots for current organization
     */
    list: () => api.get<Chatbot[]>('/api/chatbots'),

    /**
     * Get a specific chatbot
     */
    get: (chatbotId: string) => api.get<Chatbot>(`/api/chatbots/${chatbotId}`),

    /**
     * Create a new chatbot
     */
    create: (data: ChatbotCreateData) => api.post<Chatbot>('/api/chatbots', data),

    /**
     * Update a chatbot
     */
    update: (chatbotId: string, data: Partial<ChatbotCreateData>) =>
        api.patch<Chatbot>(`/api/chatbots/${chatbotId}`, data),

    /**
     * Delete a chatbot
     */
    delete: (chatbotId: string) => api.delete<{ status: string }>(`/api/chatbots/${chatbotId}`),

    /**
     * List API keys for a chatbot
     */
    getAPIKeys: (chatbotId: string) => api.get<APIKey[]>(`/api/chatbots/${chatbotId}/keys`),

    /**
     * Create a new API key
     */
    createAPIKey: (chatbotId: string, name: string) =>
        api.post<APIKey & { key: string }>(`/api/chatbots/${chatbotId}/keys`, { name }),

    /**
     * Revoke an API key
     */
    revokeAPIKey: (chatbotId: string, keyId: string) =>
        api.delete<{ status: string }>(`/api/chatbots/${chatbotId}/keys/${keyId}`),
};

export default chatbotService;

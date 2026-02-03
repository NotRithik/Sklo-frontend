/**
 * Data Service
 * API calls for facts, constraints, and history
 */
import { api } from './api';
import { Fact, Constraint, HistoricalExample } from '../types';

export interface FactCreate {
    statement: string;
    source: string;
    confidence?: number;
    category?: string;
}

export interface ConstraintCreate {
    name: string;
    description: string;
    severity?: string;
    type?: string;
    is_active?: boolean;
}

export interface HistoryCreate {
    scenario: string;
    response: string;
    tags?: string[];
}

export const dataService = {
    // ============================================================================
    // Facts
    // ============================================================================

    getFacts: (chatbotId: string) =>
        api.get<Fact[]>(`/api/chatbots/${chatbotId}/facts`),

    addFact: (chatbotId: string, data: FactCreate) =>
        api.post<Fact>(`/api/chatbots/${chatbotId}/facts`, data),

    deleteFact: (chatbotId: string, factId: string) =>
        api.delete<{ status: string }>(`/api/chatbots/${chatbotId}/facts/${factId}`),

    // ============================================================================
    // Constraints
    // ============================================================================

    getConstraints: (chatbotId: string) =>
        api.get<Constraint[]>(`/api/chatbots/${chatbotId}/constraints`),

    addConstraint: (chatbotId: string, data: ConstraintCreate) =>
        api.post<Constraint>(`/api/chatbots/${chatbotId}/constraints`, data),

    deleteConstraint: (chatbotId: string, constraintId: string) =>
        api.delete<{ status: string }>(`/api/chatbots/${chatbotId}/constraints/${constraintId}`),

    // ============================================================================
    // History
    // ============================================================================

    getHistory: (chatbotId: string) =>
        api.get<HistoricalExample[]>(`/api/chatbots/${chatbotId}/history`),

    addHistory: (chatbotId: string, data: HistoryCreate) =>
        api.post<HistoricalExample>(`/api/chatbots/${chatbotId}/history`, data),

    updateHistory: (chatbotId: string, historyId: string, data: HistoryCreate) =>
        api.put<HistoricalExample>(`/api/chatbots/${chatbotId}/history/${historyId}`, data),

    deleteHistory: (chatbotId: string, historyId: string) =>
        api.delete<{ status: string }>(`/api/chatbots/${chatbotId}/history/${historyId}`),

    // ============================================================================
    // Sessions
    // ============================================================================

    getSessions: (chatbotId: string) =>
        api.get<any[]>(`/api/chatbots/${chatbotId}/sessions`),
};

export default dataService;

/**
 * Frontend-Backend API Integration Tests
 * 
 * Run with: npm test
 * Requires backend server running at localhost:8000
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const API_BASE = 'http://localhost:8000'

// Test user credentials - created fresh for each test run
const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    company: 'Integration Test Corp'
}

let authToken: string
let chatbotId: string
let apiKeyId: string

// Helper function
async function fetchAPI(url: string, options: RequestInit = {}) {
    return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            ...options.headers,
        },
    })
}

describe('Authentication API', () => {
    it('should register a new user', async () => {
        const res = await fetchAPI('/api/register', {
            method: 'POST',
            body: JSON.stringify(testUser)
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.username).toBe(testUser.username)
    })

    it('should login and return token', async () => {
        const res = await fetch(`${API_BASE}/api/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${testUser.username}&password=${testUser.password}`
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.access_token).toBeDefined()
        authToken = data.access_token
    })

    it('should get current user info', async () => {
        const res = await fetchAPI('/api/me')

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.username).toBe(testUser.username)
    })

    it('should get user organizations', async () => {
        const res = await fetchAPI('/api/users/me/orgs')

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
    })
})

describe('Chatbot API', () => {
    it('should list chatbots', async () => {
        const res = await fetchAPI('/api/chatbots')

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        // Should have default chatbot from registration
        expect(data.length).toBeGreaterThanOrEqual(1)
        chatbotId = data[0].id
    })

    it('should create a chatbot', async () => {
        const res = await fetchAPI('/api/chatbots', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Integration Test Bot',
                description: 'Created by integration tests'
            })
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Integration Test Bot')
    })

    it('should get chatbot by id', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.id).toBe(chatbotId)
    })
})

describe('API Keys', () => {
    it('should list API keys for chatbot', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/api-keys`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
    })

    it('should create an API key', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/api-keys`, {
            method: 'POST',
            body: JSON.stringify({ name: 'Test API Key' })
        })

        expect(res.status).toBe(200)
        const data = await res.json()
        // Returns tuple: [key, info]
        if (Array.isArray(data)) {
            expect(data[0]).toMatch(/^sk_live_/)
            apiKeyId = data[1].id
        } else {
            expect(data.key || data[0]).toMatch(/^sk_live_/)
        }
    })

    it('should revoke an API key', async () => {
        // Get key ID first
        const listRes = await fetchAPI(`/api/chatbots/${chatbotId}/api-keys`)
        const keys = await listRes.json()
        const keyToRevoke = keys[keys.length - 1]?.id

        if (keyToRevoke) {
            const res = await fetchAPI(`/api/chatbots/${chatbotId}/api-keys/${keyToRevoke}`, {
                method: 'DELETE'
            })

            expect(res.status).toBe(200)
        }
    })
})

describe('Facts API', () => {
    it('should list facts for chatbot', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/facts`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
    })

    it('should add a fact', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/facts`, {
            method: 'POST',
            body: JSON.stringify({
                statement: 'Integration test fact',
                source: 'Test Suite',
                confidence: 1.0,
                category: 'General'
            })
        })

        expect(res.status).toBe(200)
    })
})

describe('Constraints API', () => {
    it('should list constraints for chatbot', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/constraints`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
    })

    it('should add a constraint', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/constraints`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test Constraint',
                description: 'Created by integration test',
                severity: 'Medium',
                type: 'Safety',
                is_active: true
            })
        })

        expect(res.status).toBe(200)
    })
})

describe('History API', () => {
    it('should list history for chatbot', async () => {
        const res = await fetchAPI(`/api/chatbots/${chatbotId}/history`)

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
    })
})

describe('Organization API', () => {
    it('should get current organization', async () => {
        const res = await fetchAPI('/api/organization')

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.id).toBeDefined()
        expect(data.name).toBeDefined()
    })

    it('should list organization members', async () => {
        const res = await fetchAPI('/api/organization/members')

        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
    })
})

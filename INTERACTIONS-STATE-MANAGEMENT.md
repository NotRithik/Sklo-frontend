# Veritas Technical Specification: State & Interactions

**Version**: 1.0
**Scope**: Frontend State Management, Interaction Data Flow, and Backend API Requirements.

---

## 1. Core Data Schemas

The frontend currently uses TypeScript interfaces (`types.ts`). The backend database must mirror these structures, with additional fields for vector embeddings and metadata.

### 1.1 Fact (Vector Database)
*   **Storage**: Vector DB (Pinecone/Milvus/pgvector).
*   **Purpose**: RAG source of truth.
*   **Schema**:
    ```json
    {
      "id": "uuid",
      "statement": "string (text-embedding-3-small)",
      "source": "string (metadata)",
      "confidence": "float (0.0-1.0)",
      "category": "enum(Product, Logistics, Legal, General)",
      "last_updated": "iso_timestamp",
      "vector_embedding": "[array<float>]"
    }
    ```

### 1.2 Constraint (Relational Database)
*   **Storage**: PostgreSQL / Redis (for fast inference injection).
*   **Purpose**: Guardrails/System Prompt injections.
*   **Schema**:
    ```json
    {
      "id": "uuid",
      "name": "string",
      "description": "string (semantic enforcement rule)",
      "is_active": "boolean",
      "severity": "enum(Critical, High, Medium, Low)",
      "type": "enum(Safety, Brand, Accuracy, Legal)"
    }
    ```

### 1.3 Conversation & Message (Time-Series / Document DB)
*   **Storage**: MongoDB / DynamoDB.
*   **Purpose**: Audit logs and real-time observation.
*   **Schema**:
    ```json
    // Conversation
    {
      "id": "uuid",
      "client_name": "string",
      "start_time": "iso_timestamp",
      "status": "enum(Active, Completed, Flagged)"
    }

    // Message
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "enum(user, assistant, system)",
      "content": "string",
      "timestamp": "iso_timestamp",
      "metadata": {
        "facts_cited": ["array<fact_id>"],
        "violated_constraint_id": "uuid | null"
      }
    }
    ```

---

## 2. Global State Management (Client-Side)

The application relies on a Lifted State architecture where `App.tsx` acts as the central store.

### 2.1 State Atoms
| State Variable | Type | Description | Persistence Strategy |
| :--- | :--- | :--- | :--- |
| `currentView` | `ViewState` | Controls active tab (Observer, Facts, etc.) | URL Param / LocalStorage |
| `selectedConvId` | `string | null` | Currently monitored live session | URL Param |
| `facts` | `Fact[]` | List of knowledge base entries | Remote Fetch (Paginated) |
| `constraints` | `Constraint[]` | List of safety rules | Remote Fetch |
| `history` | `HistoricalExample[]` | List of few-shot examples | Remote Fetch |
| `draftConstraint` | `Partial<Constraint>` | Temp state for "Flag -> Create Policy" flow | Memory Only |

---

## 3. Interaction Flows & Backend Hooks

### 3.1 Live Session Monitoring (Observer View)
**Flow**:
1.  App mounts -> Connects to WebSocket (`/ws/feed`).
2.  Server pushes `session_update` events.
3.  User clicks a session in sidebar.
4.  State `selectedConvId` updates.
5.  App subscribes to specific channel (`/ws/chat/:id`).

**API Requirements**:
*   `WS /ws/feed`: Stream summary of active sessions.
*   `WS /ws/chat/:session_id`: Stream individual message tokens, citations, and constraint violations.

### 3.2 The "Flag-to-Constraint" Pipeline
**Intent**: Human-in-the-Loop (HITL) correction. When the AI hallucinates, the operator creates a rule to prevent recurrence.

**Flow**:
1.  **Trigger**: User clicks "Flag" (Flag Icon) on a `Fact` card OR "Create Constraint" (Gavel Icon) on a `Message`.
2.  **State Change**:
    *   `draftConstraint` is populated with pre-filled data (e.g., Description: "Do not say X...").
    *   `currentView` switches to `'constraints'`.
    *   The `ConstraintsView` detects `draftConstraint` and opens the "New Constraint" modal automatically.
3.  **User Action**: User edits the draft and clicks "Save".
4.  **Backend Action**: `POST /api/constraints`.
5.  **Side Effect**: The system should invalidate the RAG cache or update the System Prompt immediately.

### 3.3 Live Fact Reinforcement
**Intent**: RLHF (Reinforcement Learning from Human Feedback) for retrieved context.

**Flow**:
1.  **Trigger**: User clicks "Thumbs Up" on a Fact card in the Observer side panel.
2.  **State Change**: UI highlights the thumb green.
3.  **Backend Action**: `POST /api/feedback`.
    ```json
    {
      "fact_id": "f1",
      "message_id": "m2",
      "score": 1,
      "context": "Reinforcement"
    }
    ```

### 3.4 Ingestion & Processing
**Flow**:
1.  **Trigger**: User drags a PDF into `IngestionModule`.
2.  **State Change**: UI shows `<Loader2 />` and "Analyzing Context".
3.  **Backend Action**: `POST /api/ingest`.
    *   *Input*: Multipart/form-data.
    *   *Process*: Text extraction -> Chunking -> OpenAI Embedding -> Vector DB Upsert.
4.  **Response**: Returns extracted `Fact[]` objects.
5.  **State Update**: The new facts are appended to the `facts` state array.

---

## 4. API Endpoint Specification (REST)

### Facts (Knowledge Base)
*   `GET /api/v1/facts?q={search}&limit=20`: Semantic search against Vector DB.
*   `POST /api/v1/facts`: Manual creation.
*   `PUT /api/v1/facts/:id`: Update statement (must re-embed vector).
*   `DELETE /api/v1/facts/:id`: Remove from Vector DB.

### Constraints (Guardrails)
*   `GET /api/v1/constraints`: List all.
*   `POST /api/v1/constraints`: Create new.
*   `PATCH /api/v1/constraints/:id/toggle`: **Critical**. Sets `isActive` true/false. Used for A/B testing safety rules.

### History (Few-Shot)
*   `GET /api/v1/history`: List examples.
*   `POST /api/v1/history`: Add new example (used for embedding generation for few-shot retrieval).

### System
*   `GET /health`: Used for the "System Online" indicator.
*   `POST /api/v1/ingest`: Accepts files/text, returns extracted entities.

---

## 5. UI/UX State Considerations for Backend

1.  **Optimistic UI**:
    *   When toggling a constraint (`isActive`), the UI switches immediately. The backend request happens in the background. If it fails, the switch reverts.

2.  **Real-Time Latency**:
    *   The "Live Fact Extraction" panel must appear *as* the message is streaming. The backend must send retrieval metadata (which facts were used) in the *first* packet of the stream, not the last.

3.  **Search Debouncing**:
    *   The `FactDatabaseView` search input updates state on every keystroke. The backend call must be debounced (300ms) to prevent Vector DB throttling.

4.  **Modal State**:
    *   Modals (`AddFactModal`, `ItemDetailPopup`) are conditional render states. They map to specific URL query parameters (optional enhancement) to allow deep-linking to a specific violation report.

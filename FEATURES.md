# Veritas Protocol Interface - Feature Specification

**Intent**: This dashboard serves as a "Human-in-the-Loop" (HITL) governance layer for an AI agent (specifically tailored for Brewery Intelligence in the mock data). It allows operators to observe real-time conversations, verify facts against a trusted ledger, manage safety constraints, and provide historical context for few-shot learning.

**Codebase Navigation**: Search for the tags in brackets (e.g., `[FEATURE: OBSERVER_VIEW]`) in the `App.tsx` file to locate the specific implementation logic.

---

## 1. Core Navigation & System Status
**Anchor**: `[FEATURE: NAVIGATION_HEADER]`

A persistent top bar that provides navigation between the four core pillars of the system.
*   **Visuals**: Glassmorphism effect (`backdrop-blur`), sticky positioning.
*   **System Status**: A pulsing "System Online" indicator simulating a connection to the inference engine.
*   **Routing**: Client-side state routing (`ViewState`) to switch active panels without page reloads.

## 2. Observer Dashboard
**Anchor**: `[FEATURE: OBSERVER_VIEW]`

The primary command center for monitoring active AI sessions.

### 2.1 Live Session Feed
**Anchor**: `[FEATURE: LIVE_SESSION_LIST]`
*   **Functionality**: Displays a list of active or flagged conversations.
*   **Behavior**:
    *   Clicking the "Observer" tab resets the selection to a "No Session Selected" state.
    *   Active sessions show a Green badge; Flagged sessions (requiring human review) show Red.
    *   Includes visual cues (orange left-border) for the currently selected session.

### 2.2 Chat Transcript Protocol
**Anchor**: `[FEATURE: CHAT_TRANSCRIPT]`
*   **Display**: Renders the conversation history between User and Assistant.
*   **Smart Annotations**:
    *   **Policy Enforced**: If the AI refuses a request based on a constraint, a red shield appears. Clicking it opens the specific policy details.
    *   **Verified Fact**: If the AI cites a fact, a reference badge (e.g., `VERIFIED: REF-f1`) appears. Clicking it shows the source truth.
*   **Human Intervention**: Hovering over an Assistant message allows the operator to "Create Constraint," instantly turning a bad response into a new safety rule.

### 2.3 Real-time Fact Extraction
**Anchor**: `[FEATURE: LIVE_FACT_EXTRACTION]`
*   **Intent**: To show the operator *why* the AI said what it said.
*   **Functionality**: A side panel that displays the specific database rows (facts) retrieved via RAG (Retrieval-Augmented Generation) for the current response.
*   **Reinforcement Learning**: Operators can "Thumbs Up" helpful retrievals or "Flag" hallucinations.

---

## 3. Fact Ledger (Knowledge Base)
**Anchor**: `[FEATURE: FACT_LEDGER]`

The immutable source of truth. The AI uses RAG to query this database before answering.

*   **Search**: Real-time filtering of facts.
*   **CRUD Operations**:
    *   **Add**: Manual entry or file ingestion.
    *   **Edit**: Modify statements if product specs change.
    *   **Delete**: Remove outdated information.
*   **Metadata**: Tracks confidence score, source document, and last updated date.

---

## 4. Constraints Engine (Safety & Compliance)
**Anchor**: `[FEATURE: CONSTRAINTS_ENGINE]`

Hard boundaries for the AI model. These are likely injected as system prompts or guardrail checks.

*   **Categorization**: Safety, Brand, Accuracy, Legal.
*   **Severity Levels**: Critical, High, Medium, Low.
*   **Toggles**: A visual switch to activate/deactivate specific rules without deleting them.
*   **Drafting**: When an operator flags a hallucination in the *Observer* view, it pre-fills a draft in this view.

---

## 5. Context History (Few-Shot Learning)
**Anchor**: `[FEATURE: CONTEXT_HISTORY]`

A repository of "Golden Examples" (Few-Shot Prompting). This data helps the model understand how to handle edge cases by looking at past human resolutions.

*   **Structure**: Scenario (Input) -> Resolution (Ideal Output).
*   **Tagging**: Organizing examples by topic (e.g., Logistics, Pricing).

---

## 6. Data Ingestion Module
**Anchor**: `[FEATURE: INGESTION_MODULE]`

A reusable component for getting unstructured data into the system.

*   **Multi-modal Input**: Supports File Upload (Drag & Drop), Text Paste, and Image Paste.
*   **Simulation**: Currently mocks the "Processing/Vectorizing" delay to demonstrate UI states for loading and extraction.

---

## Backend Architectural Implications

If you are building the backend for this, consider the following mapping:

1.  **Observer (WebSocket/SSE)**: The `[FEATURE: CHAT_TRANSCRIPT]` needs a real-time stream. Use WebSockets to push `new_token` or `new_message` events to the frontend.
2.  **Fact Ledger (Vector DB)**: The `[FEATURE: FACT_LEDGER]` maps directly to a Vector Database (like Pinecone, Milvus, or pgvector).
    *   *Read*: Semantic search.
    *   *Write*: Embedding generation + Upsert.
3.  **Constraints (Redis/Postgres)**: These are likely fast-access rules. When `isActive` is toggled in `[FEATURE: CONSTRAINTS_ENGINE]`, it should update a Redis cache used by the Guardrails middleware.
4.  **Ingestion (Task Queue)**: The `[FEATURE: INGESTION_MODULE]` should trigger a background job (Celery/BullMQ) to parse PDFs, chunk text, and generate embeddings.

# Architecture: Chat Finance Agentic System 🤖📈

This document provides a detailed overview of the core architecture behind **Chat Finance** — a serverless, agentic financial dashboard powered by **Gemma 4 (`gemma-4-26b-a4b-it`)**, **React 18**, **Vite**, **TypeScript**, and hosted on **Cloudflare Workers**.

---

## 🏗️ Core Architecture Overview

```mermaid
graph TD
    User([User]) -->|Input Query / Configure API Key| UI[React UI: ChatPanel & MarketPanel]
    UI -->|Read / Write API Key & Memory| Storage[(Browser LocalStorage)]
    UI -->|Async Generator Stream| AgentLoop[Client-side ReAct Loop: runAgentGraph]

    subgraph "Browser Runtime (100% Client-Side Serverless)"
        AgentLoop -->|Step 1: Reason| ReasonNode["reasonNode (gemma-4-26b-a4b-it + Google Grounding)"]
        ReasonNode -->|Action: call_tools| ExecNode[executeToolsNode: Parallel Promise.all]
        ExecNode -->|Loop <= 5 iterations| ReasonNode
        ReasonNode -->|Action: final_answer| GenNode["generateResponseNode (gemma-4-26b-a4b-it)"]
        ExecNode -->|Max iterations reached| GenNode
        GenNode -->|Yield final report & sources| UI
    end

    subgraph "External REST & Grounding APIs"
        ExecNode -->|Fetch CORS| Binance[Binance Public API: Crypto & PAXG]
        ExecNode -->|Fetch CORS| VNDNSE[VNDirect & DNSE APIs: VN-Index & VN Stocks]
        ExecNode -->|Fetch CORS / Proxy| USStocks[Yahoo Finance / Stooq: US Equities]
        ReasonNode -->|Google GenAI SDK| GoogleGrounding[Native Google Search Grounding]
    end
```

---

## 🛠️ Key Technologies

- **Large Language Model**: [Gemma 4 (`gemma-4-26b-a4b-it`)](https://ai.google.dev) via official `@google/genai` TypeScript SDK.
- **Search & Reasoning**: Native Google Search Grounding + High Thinking Level.
- **Frontend Framework**: React 18, TypeScript, Vite 6.
- **Styling**: Vanilla CSS Glassmorphism Dark Mode Terminal.
- **Charting**: TradingView Embedded Live Technical Chart.
- **Edge Hosting**: Cloudflare Workers (Static Assets SPA).

---

## 🔄 Agentic Execution Flow

1. **Intake & Context Restoration**:
   - The user query is recorded in `ConversationMemory` (persisted in `localStorage`).
   - The last exchanges are formatted and injected into the prompt context along with real-time timestamp information.

2. **Reasoning (`reasonNode`)**:
   - Evaluates the query or tool results from preceding iterations.
   - Leverages `gemma-4-26b-a4b-it` to decide whether external data is required.
   - Extracts native thoughts and Google Search citations in real time.

3. **Execution (`executeToolsNode`)**:
   - Resolves tool calls concurrently using `Promise.all()`.
   - Normalizes input parameters and enforces resilience with try-catch blocks and API fallbacks.

4. **Synthesis (`generateResponseNode`)**:
   - When all required tools finish or when max iterations (5) are hit, synthesizes a structured Markdown report with source citations.

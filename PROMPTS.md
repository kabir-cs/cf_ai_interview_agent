# cf_ai_recruiter_portal - Kabir Sheikh

This is an AI-powered Recruitment Portal designed for the Cloudflare Summer 2026 Engineering Internship assignment.

## Architectural Highlights
* **Brain:** Meta Llama 3.3 running on Cloudflare Workers AI.
* **State Management:** Utilizes **Durable Objects** to maintain a persistent `CandidateState` (Interview Progress, Scores, Focus Topics).
* **Live Synchronization:** The React UI uses RPC calls to fetch live stats from the Agent's memory, visualizing progress in a real-time dashboard.
* **Coordination:** The Agent coordinates a structured 5-question interview flow, providing a final hiring recommendation upon completion.

## Setup (Local)
1. `npm install`
2. `nvm use 24`
3. `npm run dev`
4. Visit `localhost:5173` to start your interview.
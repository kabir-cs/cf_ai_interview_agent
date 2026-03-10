# Cloudflare Technical Recruiter AI 🚀

**Live Demo:** [https://cf-ai-interview-agent.kabirs112203.workers.dev](https://cf-ai-interview-agent.kabirs112203.workers.dev)

![Platform Preview](./preview.png)

## Overview
This is an AI-powered stateful Technical Recruitment Portal developed for the **Cloudflare Summer 2026 Engineering Internship** assignment. 

It is built utilizing modern Cloudflare infrastructure, specifically leveraging the **Cloudflare Agents SDK** to orchestrate LLM workflows and **Durable Objects** to manage real-time synchronized candidate state natively on the edge.

## Core Architecture

- **The Brain**: Meta `Llama-3.3-70b-instruct` running on **Cloudflare Workers AI** for rapid, on-edge inference without third-party API keys or external latency hops.
- **State Management**: **Durable Objects** persist the `CandidateState` reliably across sessions natively. It dynamically tracks metrics like `score`, `questionsAsked`, `strengths`, and `areasForImprovement`.
- **Real-Time Sync**: The React UI hooks into the Agent's RPC (`@callable`) endpoints, effortlessly syncing the candidate's grading metrics to the frontend Dashboard live via persistent remote connections.
- **Frontend Layer**: Built with **React**, **Vite**, **Tailwind CSS**, and Cloudflare's **Kumo UI** component system.

## Features & Interview Mechanics

1. **Structured Interview Flow**: The AI strictly adheres to a 5-question sequential interview timeline evaluating the candidate on specific architectural concepts (Workers, KV, R2, Durable Objects, Workers AI).
2. **Deterministic Text-Based Scoring**: To mitigate JSON function generation hallucination errors prevalent natively without heavier models, background tooling was swapped for direct regex text-parsing (`[SCORE: 0.5]`), massively accelerating response times. 
3. **Adaptive UI Insights**: The interface sidebars update dynamically, reflecting accurately calculated fractional points (differentiating between partial vs perfect technical clarity) and assigning candidate progression labels effortlessly.
4. **Resiliency**: Chat progression persists stably against accidental browser reloads. The "Clear" button manually enforces an RPC call to `resetState()` to surgically wipe the underlying SQL database instance for subsequent trials.

## Local Development

```bash
# Install dependencies
npm install

# Start the Vite development server locally
npm run dev
```

Visit `http://localhost:5174` to start a local technical screening.

## Remote Deployment

The application is bundled for deployment directly to Cloudflare's global edge network seamlessly:

```bash
npm run deploy
```

## Authors
Kabir Sheikh

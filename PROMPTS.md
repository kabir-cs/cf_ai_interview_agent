# AI Generation and Prompts Log

This document outlines the highly specific prompts and interactions I had with AI assistants during the development of the Cloudflare Technical Recruiter AI platform. 

My philosophy when utilizing Artificial Intelligence is to treat the AI as an advanced pair programmer. I functioned as the strict systems architect by defining the Durable Objects data schema, dictating the error fallback mechanisms, and designing the real time Websocket syncing architecture. I then leveraged AI to accelerate boilerplate generation, optimize regex string parsing, and debug specific framework edge cases.

Below are the specific contextual prompts I used during the development lifecycle:

## 1. Architecting the Durable Object State Synchronization
**Context:** I needed a highly efficient way to sync the candidate grading metrics from the Durable Object to the Vite frontend dynamically over the Agents SDK websocket. I wanted to avoid the latency of manual database polling and ensure sub millisecond state updates.
**Prompt:**
> *"I am building a Cloudflare Agents application where a Durable Object manages a CandidateState interface tracking score, questionCount, and strengths. Instead of traditional polling, I want the React frontend to strictly bind to this state. How can I leverage the @callable RPC decorators within the Cloudflare Agents SDK to expose a real time getter for this state? Furthermore, what is the optimal React hook pattern to seamlessly re render a Live Progress dashboard whenever the Durable Object undergoes a mutation, ensuring we do not encounter race conditions when concurrent renders happen?"*

## 2. Eliminating Tool Call Hallucinations for Faster Inference
**Context:** Initially, I passed scoreAnswer as a strict JSON tool schema to streamText. However, utilizing natively run smaller models sometimes resulted in raw JSON strings leaking into the chat window. I architected a deterministic text parsing workaround and needed the precise regex implementation.
**Prompt:**
> *"I am refactoring my streamText configuration to completely drop Native Tool Calling in order to avoid JSON format hallucinations and significantly reduce LLM inference latency. Instead, I am enforcing the model via the System Prompt to prefix its evaluations with a strict string token, such as [SCORE: 0.5]. I need to hook into the onFinish stream callback in server.ts. Can you write a highly robust Regex pattern and parsing function to extract [SCORE: X] from the raw text payload, cleanly cast it to a numerical float, and push the state mutation directly into the Durable Object persistent storage?"*

## 3. Resolving Webpack and Vite Build Incompatibilities
**Context:** The application utilized Cloudflare Kumo for UI components, but the Vite Rollup build failed due to an ESM and CommonJS export aliasing mismatch with Phosphor Icons.
**Prompt:**
> *"My Vite build is crashing because the Kumo UI package attempts to import icons from the Phosphor Icons React package using an Icon suffix like ExportIcon, but the current Phosphor package drops the suffix. Instead of patching node packages or downgrading dependencies, I want to intercept this at the Rollup build step. Write a custom Vite alias plugin that intercepts imports targeting the Phosphor Icons package and dynamically proxies requests ending in Icon to their correct, underlying non suffixed exports during the AST parsing phase."*

## 4. Hardening the Cloudflare AI Context Window
**Context:** I discovered a backend Node crash, specifically InvalidPromptError, occurring when the chat history was completely wiped natively via resetState(). The Cloudflare AI SDK strictly forbids evaluating an empty message array.
**Prompt:**
> *"When a user manually clicks Clear to wipe their React interface and the Durable Object wipes its persistent SQL history, the subsequent call to streamText instantly crashes the Dev Server with an InvalidPromptError stating messages must not be empty. I need to intercept the messages array right before it hits the Cloudflare workers AI handler. What is the cleanest, most standard compliant architectural way to inject a zero shot empty conversational spacer solely as a fallback if the converted messages array length evaluates exactly to zero?"*

## 5. User Interface Context: Enforcing Strict Rendering Paradigms
**Context:** The starter application shipped with an uncontrollable OS level dark mode interceptor. I needed to isolate the application solely to a Light theme to match specific Cloudflare branding guidelines.
**Prompt:**
> *"I need to surgically remove any dark mode media query listeners and localStorage theme overrides from the base index.html script in a Vite React stack. I want to statically lock document.documentElement.style.colorScheme to strictly light and strip out all Tailwind dark prefixed utility classes across the application component tree. Provide a foolproof method to guarantee a locked light mode aesthetic that forces the browser rendering engine to ignore system preferences."*
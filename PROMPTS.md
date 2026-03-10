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

## 6. Securing the Edge Data Pipeline
**Context:** When the React client submits a chat message to the Agent websocket, I needed to guarantee that malicious payloads could not corrupt the CandidateState object or trigger prompt injection vulnerabilities within the LLM context.
**Prompt:**
> *"I am utilizing Cloudflare Workers AI with the Meta Llama 3 70b instruct model. My user input is sent from a React frontend directly into the server streamText handler. To prevent prompt injection and ensure secure data handling, what are the best architectural practices using native Cloudflare APIs to parse, sanitize, and validate incoming websocket messages before they are processed by the AI and stored in the Durable Object storage?"*

## 7. Optimizing Frontend Delivery via the Global CDN
**Context:** To ensure the Vite React application loads instantly regardless of the user location, I wanted to maximize static asset caching on the Cloudflare global network while preventing stale data during active interview sessions.
**Prompt:**
> *"The frontend of my application is a standard Vite React build deployed alongside my Cloudflare Worker. To ensure lightning fast delivery, I want the Cloudflare CDN to aggressively cache static Javascript and CSS assets. However, I must ensure that the websocket connections to the Durable Object are completely exempt from this caching. What specific caching headers and network configurations should I implement in my worker deployment to achieve this optimal balance?"*

## 8. Architecting Resilient React State Structures
**Context:** As the interview progresses, the dashboard needs to instantly reflect complex nested metric changes such as the current score fraction and individual skill proficiencies, without triggering expensive DOM repaints across the entire application interface.
**Prompt:**
> *"Within my Vite application, the Live Progress dashboard consumes complex nested data from the Cloudflare Agent. Specifically, the metrics include fractional scores and arrays of string based strengths. To maintain a smooth user experience, what advanced React rendering strategies, such as memoization or selective context distribution, should I apply to completely eliminate unnecessary component renders when only a specific subset of the CandidateState is updated via the edge network?"*
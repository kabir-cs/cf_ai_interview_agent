/**
 * Name: Kabir Sheikh
 * Intent: Cloudflare Technical Recruiter Agent.
 * 
 * This agent conducts a rigorous 5-question technical interview covering
 * Cloudflare's platform. It evaluates the candidate's answers and tracks 
 * progress natively.
 */

import { createWorkersAI } from "workers-ai-provider";
import { routeAgentRequest, callable, type Schedule } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  streamText,
  convertToModelMessages,
  tool
} from "ai";
import { z } from "zod";

interface CandidateState {
  score: number;
  questionCount: number;
  strengths: string[];
  areasForImprovement: string[];
  currentFocus: string;
  questionsAsked: string[];
  questionScores: number[];
  interviewComplete: boolean;
}

const INTERVIEW_TOPICS = [
  "Cloudflare Workers & Edge Computing",
  "KV, R2 & Data Storage",
  "Durable Objects & Stateful Applications",
  "AI, Models & Inference on the Edge",
  "System Design & Architecture"
] as const;

export class ChatAgent extends AIChatAgent<Env, CandidateState> {
  waitForMcpConnections = true;

  initialState: CandidateState = {
    score: 0,
    questionCount: 0,
    strengths: [],
    areasForImprovement: [],
    currentFocus: "Introduction",
    questionsAsked: [],
    questionScores: [],
    interviewComplete: false,
  };

  onStart() {
    this.mcp.configureOAuthCallback({
      customHandler: (result) => {
        if (result.authSuccess) {
          return new Response("<script>window.close();</script>", {
            headers: { "content-type": "text/html" },
            status: 200
          });
        }
        return new Response(
          `Authentication Failed: ${result.authError || "Unknown error"}`,
          { headers: { "content-type": "text/plain" }, status: 400 }
        );
      }
    });
  }

  @callable()
  async getCandidateStats() {
    return this.state;
  }

  @callable()
  async resetState() {
    await this.setState(this.initialState);
    await this.saveMessages([]);
    return this.state;
  }

  @callable()
  async addServer(name: string, url: string, host: string) {
    return await this.addMcpServer(name, url, { callbackHost: host });
  }

  @callable()
  async removeServer(serverId: string) {
    await this.removeMcpServer(serverId);
  }

  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const mcpTools = this.mcp.getAITools();
    const workersai = createWorkersAI({ binding: this.env.AI });
    const currentState = this.state as CandidateState;
    const questionsAsked = currentState?.questionsAsked || [];
    const questionScores = currentState?.questionScores || [];
    const questionCount = currentState?.questionCount || 0;
    const currentScore = currentState?.score || 0;

    const askedSummary = questionsAsked.length > 0
      ? `\nQuestions already asked:\n${questionsAsked.map((q, i) => `  ${i + 1}. [${INTERVIEW_TOPICS[i]}]`).join("\n")}`
      : "";

    const nextTopicIndex = questionCount;
    const nextTopic = nextTopicIndex < INTERVIEW_TOPICS.length
      ? INTERVIEW_TOPICS[nextTopicIndex]
      : null;

    const systemPrompt = `You are a friendly but rigorous Cloudflare Technical Recruiter AI conducting a 5-question interview for the Engineering Internship.
Candidate: Kabir Sheikh
Progress: ${questionCount}/5 questions completed.
Current Score: ${currentScore}/${questionCount}

INSTRUCTIONS:
1. GREETING: If this is the start of the interview, briefly introduce yourself and immediately ask Question 1 about ${INTERVIEW_TOPICS[0]}. DO NOT assign a score for the greeting.
2. SCORING: When the candidate answers a technical question, you MUST evaluate their answer and start your response exactly with the text "[SCORE: 0]", "[SCORE: 0.5]", or "[SCORE: 1]".
   - [SCORE: 0] = incorrect/no understanding
   - [SCORE: 0.5] = partial understanding
   - [SCORE: 1] = excellent/deep understanding
3. After the score block, briefly provide feedback on their answer.
4. Then, immediately ask the NEXT question about the next topic.
5. Topics in order: ${INTERVIEW_TOPICS.join(", ")}. Never repeat topics or ask more than one question at a time.
6. Once 5 questions are answered and scored, provide a final evaluation with a hiring recommendation.

Please keep responses concise and focused exactly on the technical interview. Do not use any external tools or schedule anything!
${askedSummary}
${nextTopic ? `NEXT TOPIC TO ASK: ${nextTopic}` : ""}
`;

    const agent = this;

    const convertedMessages = await convertToModelMessages(this.messages);
    const result = await streamText({
      model: workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
      system: systemPrompt,
      messages: convertedMessages.length > 0 ? convertedMessages : [{ role: "user", content: " " }],
      onFinish: async ({ text }) => {
        // Parse the score from the LLM's text output
        const scoreMatch = text.match(/\[SCORE:\s*(0|0\.5|1)\]/i);
        if (scoreMatch) {
          const score = parseFloat(scoreMatch[1]);
          const state = agent.state as CandidateState;

          const newQuestionCount = (state.questionCount || 0) + 1;
          const newScore = (state.score || 0) + score;
          const currentStrengths = state.strengths || [];
          const currentAreas = state.areasForImprovement || [];

          const questionTopic = state.currentFocus;

          const newStrengths = score >= 0.75
            ? [...currentStrengths, questionTopic]
            : currentStrengths;
          const newAreas = score < 0.75
            ? [...currentAreas, questionTopic]
            : currentAreas;
          const isComplete = newQuestionCount >= 5;

          const nxtTopic = newQuestionCount < INTERVIEW_TOPICS.length
            ? INTERVIEW_TOPICS[newQuestionCount]
            : "Final Evaluation";

          await agent.setState({
            ...state,
            score: newScore,
            questionCount: newQuestionCount,
            strengths: newStrengths,
            areasForImprovement: newAreas,
            currentFocus: nxtTopic,
            questionScores: [...(state.questionScores || []), score],
            // As a proxy for the actual question text, we'll store the topic or the start of the LLM's response
            questionsAsked: [...(state.questionsAsked || []), questionTopic],
            interviewComplete: isComplete,
          });
        }
      },
      abortSignal: options?.abortSignal
    });

    return result.toUIMessageStreamResponse();
  }

  async executeTask(description: string, _task: Schedule<string>) {
    this.broadcast(JSON.stringify({
      type: "scheduled-task",
      description,
      timestamp: new Date().toISOString()
    }));
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (await routeAgentRequest(request, env)) || new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { type Question, type NewsArticle } from "./types";
import { buildQuestionGenerationPrompt, buildFallbackPrompt } from "./prompts";

const QuestionSchema = z.object({
  question: z.string(),
  options: z.object({
    a: z.string(),
    b: z.string(),
    c: z.string(),
    d: z.string(),
  }),
  correct_answer: z.enum(["a", "b", "c", "d"]),
  explanation: z.string(),
  topic: z.enum([
    "polity",
    "economy",
    "environment",
    "history_culture",
    "current_affairs",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(["statement_based", "direct_mcq", "match_pair", "assertion_reason"]),
  source_article: z.string(),
  upsc_concept_link: z.string(),
});

const QuestionsArraySchema = z.array(QuestionSchema).length(10);

function extractJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function generateQuestions(
  articles: NewsArticle[],
  period: string
): Promise<Question[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const client = new Anthropic({ apiKey });

  const prompt =
    articles.length > 0
      ? buildQuestionGenerationPrompt(articles)
      : buildFallbackPrompt(period);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonStr = extractJson(responseText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const retryMessage = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: responseText },
        {
          role: "user",
          content:
            "Your output was not valid JSON. Return ONLY the JSON array of 10 question objects with no other text.",
        },
      ],
    });

    const retryText =
      retryMessage.content[0].type === "text"
        ? retryMessage.content[0].text
        : "";
    parsed = JSON.parse(extractJson(retryText));
  }

  const validated = QuestionsArraySchema.parse(parsed);

  return validated.map((q, idx) => ({
    ...q,
    id: idx,
  }));
}

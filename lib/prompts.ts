import { type NewsArticle, type Topic, type Difficulty } from "./types";
import { TOPIC_DISTRIBUTION, DIFFICULTY_DISTRIBUTION } from "./constants";

export function buildQuestionGenerationPrompt(
  articles: NewsArticle[]
): string {
  const articleContext = articles
    .map(
      (a, i) =>
        `[${i + 1}] "${a.title}" (${a.source}, ${a.pubDate.split("T")[0]})\n${a.description.slice(0, 300)}`
    )
    .join("\n\n");

  return `You are a UPSC Civil Services Preliminary Examination question paper setter with 20 years of experience setting papers for India's toughest competitive exam.

## CURRENT AFFAIRS ARTICLES FOR REFERENCE
${articleContext}

## TASK
Generate exactly 10 multiple-choice questions based on the above current affairs. Each question MUST link a current news event to an underlying UPSC static syllabus concept.

## TOPIC DISTRIBUTION (strictly follow)
- Polity & Governance: ${TOPIC_DISTRIBUTION.polity} questions
- Economy: ${TOPIC_DISTRIBUTION.economy} questions
- Environment & Ecology: ${TOPIC_DISTRIBUTION.environment} questions
- History & Culture: ${TOPIC_DISTRIBUTION.history_culture} questions
- Science/Tech/IR/Geography: ${TOPIC_DISTRIBUTION.current_affairs} questions

## DIFFICULTY DISTRIBUTION (strictly follow)
- Easy (direct factual, single concept): ${DIFFICULTY_DISTRIBUTION.easy} questions
- Medium (requires connecting 2 concepts or careful elimination): ${DIFFICULTY_DISTRIBUTION.medium} questions
- Hard (multi-layered, tests exceptions/nuances): ${DIFFICULTY_DISTRIBUTION.hard} questions

## QUESTION FORMAT MIX (use these formats)

**Format 1: Statement-Based** (use for 5 questions)
"Consider the following statements:
1. [Statement]
2. [Statement]
3. [Statement]
Which of the statements given above is/are correct?
(a) 1 only (b) 1 and 2 only (c) 2 and 3 only (d) 1, 2 and 3"

**Format 2: Direct Conceptual MCQ** (use for 3 questions)
"[Direct question]
(a) Option (b) Option (c) Option (d) Option"

**Format 3: Match the Following** (use for 1 question)
"Match List-I with List-II and select the correct answer using the code given below:"

**Format 4: Assertion-Reason** (use for 1 question)
"Statement-I: [assertion]
Statement-II: [reason]
(a) Both are correct and II explains I
(b) Both are correct but II does not explain I
(c) I is correct but II is not correct
(d) I is not correct but II is correct"

## CRITICAL QUALITY RULES
1. Exactly ONE correct answer per question — no ambiguity
2. Use UPSC-style formal language (e.g., "With reference to", "Consider the following")
3. Include traps: partially correct statements, extreme words ("only", "always"), similar-sounding terms
4. Prefer conceptual clarity over rote memorization
5. For current affairs questions, always link to the underlying static concept (e.g., a news article about a new wildlife sanctuary → test knowledge of Wildlife Protection Act schedules)
6. Avoid "All of the above" and "None of the above"
7. Explanations must explain why EACH option is correct/incorrect
8. Use precise constitutional/legal/scientific terminology

## OUTPUT FORMAT
Return a JSON array with exactly 10 objects. Each object MUST have this structure:
{
  "question": "Full question text including all statements/lists",
  "options": { "a": "Option A text", "b": "Option B text", "c": "Option C text", "d": "Option D text" },
  "correct_answer": "a",
  "explanation": "Detailed explanation: why correct answer is right, why each wrong option is wrong. Include an elimination tip.",
  "topic": "polity|economy|environment|history_culture|current_affairs",
  "difficulty": "easy|medium|hard",
  "format": "statement_based|direct_mcq|match_pair|assertion_reason",
  "source_article": "Title of the source article used",
  "upsc_concept_link": "Static UPSC concept tested (e.g., 'Article 368 - Amendment Procedure')"
}

Return ONLY the JSON array. No markdown fences, no commentary, no preamble.`;
}

export function buildFallbackPrompt(period: string): string {
  const periodLabel =
    period === "last_week"
      ? "the past week"
      : period === "last_month"
        ? "the past month"
        : "the past year";

  return `You are a UPSC Civil Services Preliminary Examination question paper setter with 20 years of experience.

Generate exactly 10 multiple-choice questions for a UPSC Prelims GS-I mock test. The questions should be based on current affairs from ${periodLabel} connected to static UPSC concepts.

## TOPIC DISTRIBUTION (strictly follow)
- Polity & Governance: 2 questions
- Economy: 2 questions
- Environment & Ecology: 2 questions
- History & Culture: 2 questions
- Science/Tech/IR/Geography: 2 questions

## DIFFICULTY DISTRIBUTION
- Easy: 3 questions
- Medium: 5 questions
- Hard: 2 questions

## FORMAT MIX
- 5 statement-based ("Consider the following statements:")
- 3 direct conceptual MCQs
- 1 match-the-pair
- 1 assertion-reason

## QUALITY RULES
1. Exactly ONE correct answer — no ambiguity
2. Use formal UPSC language
3. Include traps (extreme words, partial correctness, similar terms)
4. Test conceptual understanding, not rote recall
5. Link current events to static syllabus concepts
6. Explanations must cover ALL options

## OUTPUT FORMAT
Return a JSON array with exactly 10 objects:
{
  "question": "Full question text",
  "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
  "correct_answer": "a|b|c|d",
  "explanation": "Why correct is correct, why others are wrong. Include elimination tip.",
  "topic": "polity|economy|environment|history_culture|current_affairs",
  "difficulty": "easy|medium|hard",
  "format": "statement_based|direct_mcq|match_pair|assertion_reason",
  "source_article": "Current affairs topic referenced",
  "upsc_concept_link": "Static concept tested"
}

Return ONLY the JSON array. No markdown, no commentary.`;
}

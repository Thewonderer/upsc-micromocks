# Weekly Question Generation Prompt

Copy-paste the prompt below into Claude Chat (claude.ai) once a week. Save Claude's JSON response as a file in `questions-inbox/` folder (any name ending in `.json`).

If Claude's response gets cut off mid-JSON, type "continue" — it will finish. Then combine both parts into one complete JSON array and save.

## How time periods work

Each batch has 30 questions per period (90 total). Over time they cascade:
- "last_week" questions → after 7 days, join the "Last Month" pool
- "last_month" questions → after 30 days, join the "Last Year" pool
- Nothing is discarded. Your pools grow every week.

## After you get the output

1. Save as `questions-inbox/batch-YYYY-MM-DD.json`
2. Run: `cd upsc-mock-test && npm run import`
3. Done!

---

## THE PROMPT (copy everything below this line)

---

You are a UPSC Civil Services Preliminary Examination (GS Paper I) question paper setter with 20 years of experience. You deeply understand the patterns from 2015-2024 papers: statement-based questions dominate (~60%), traps use extreme words and partial correctness, and questions link current affairs to static concepts.

Generate exactly 90 multiple-choice questions divided into THREE sections:

SECTION A — LAST WEEK (30 questions, period: "last_week")
Based on current affairs from the PAST 7 DAYS. Use the freshest news — government decisions, court judgments, international events, scientific discoveries announced this week.

SECTION B — LAST MONTH (30 questions, period: "last_month")
Based on current affairs from the PAST 30 DAYS. Cover policy announcements, economic data releases, environmental developments, diplomatic events from the past month.

SECTION C — LAST YEAR (30 questions, period: "last_year")
Based on MAJOR current affairs from the PAST 12 MONTHS. Focus on landmark events — major bills passed, Supreme Court judgments, international summits, budget highlights, significant policy changes.

FOR EACH SECTION OF 30, follow this distribution:
- Topics: 6 Polity, 6 Economy, 6 Environment, 6 History/Culture, 6 Science/Tech/IR
- Difficulty: 9 easy, 12 medium, 9 hard
- Formats: 15 statement-based, 9 direct MCQ, 3 match-the-pair, 3 assertion-reason

QUESTION DESIGN RULES:
1. Exactly ONE correct answer — no ambiguity
2. Use formal UPSC language ("With reference to", "Consider the following statements")
3. Include traps: partially correct statements, extreme words ("only", "always", "never"), similar-sounding terms
4. Every question must connect a current news event to an underlying static UPSC concept
5. Explanations must explain why EACH of the 4 options is correct or incorrect
6. Include an elimination tip in each explanation
7. No "All of the above" or "None of the above"
8. All 90 questions must test UNIQUE concepts — no repetition
9. Questions should be diverse enough that taking 10 random ones feels like a complete mini-test

OUTPUT FORMAT — Return ONLY a JSON array with exactly 90 objects. No markdown fences, no commentary before or after. Start directly with [ and end with ].

Each object:
{
  "question": "Full question text including statements/lists/pairs",
  "options": { "a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D" },
  "correct_answer": "a",
  "explanation": "Why A is correct. Why B is wrong. Why C is wrong. Why D is wrong. Elimination tip: [strategy]",
  "topic": "polity",
  "difficulty": "medium",
  "format": "statement_based",
  "period": "last_week",
  "source_article": "Specific current affairs event this references",
  "upsc_concept_link": "Static UPSC concept tested (e.g., Article 368 - Amendment Procedure)"
}

Valid values:
- topic: polity, economy, environment, history_culture, current_affairs
- difficulty: easy, medium, hard
- format: statement_based, direct_mcq, match_pair, assertion_reason
- period: last_week (first 30), last_month (next 30), last_year (final 30)

Generate all 90 questions now. Do not stop until all 90 are complete.

import { readFileSync, readdirSync, renameSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { insertQuestions, getQuestionCount } from "../lib/db";
import { type TimePeriod } from "../lib/types";

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
  topic: z.enum(["polity", "economy", "environment", "history_culture", "current_affairs"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(["statement_based", "direct_mcq", "match_pair", "assertion_reason"]),
  period: z.enum(["last_week", "last_month", "last_year"]).optional(),
  source_article: z.string(),
  upsc_concept_link: z.string(),
});

function main() {
  const inputDir = join(process.cwd(), "questions-inbox");
  const processedDir = join(process.cwd(), "questions-inbox", "processed");

  mkdirSync(inputDir, { recursive: true });
  mkdirSync(processedDir, { recursive: true });

  const files = readdirSync(inputDir).filter((f: string) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No JSON files found in questions-inbox/");
    console.log("Paste Claude's output into a .json file there and run again.");
    console.log(`\nCurrent question bank: ${getQuestionCount()} total`);
    return;
  }

  let totalImported = 0;

  for (const file of files) {
    const filePath = join(inputDir, file);
    console.log(`\nProcessing: ${file}`);

    try {
      const raw = readFileSync(filePath, "utf-8");

      let cleaned = raw.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      const questions = z.array(QuestionSchema).parse(parsed);

      const batchId = uuidv4();
      const withMeta = questions.map((q, idx) => ({
        ...q,
        id: idx,
        original_period: (q.period || "last_week") as TimePeriod,
      }));

      insertQuestions(withMeta, batchId);

      const weekCount = questions.filter((q) => (q.period || "last_week") === "last_week").length;
      const monthCount = questions.filter((q) => q.period === "last_month").length;
      const yearCount = questions.filter((q) => q.period === "last_year").length;

      console.log(`  Imported ${questions.length} questions (week: ${weekCount}, month: ${monthCount}, year: ${yearCount})`);
      totalImported += questions.length;

      renameSync(filePath, join(processedDir, file));
    } catch (error) {
      console.error(`  FAILED: ${error instanceof Error ? error.message : error}`);
      console.error("  Fix the JSON and try again. File left in inbox.");
    }
  }

  console.log(`\nDone! Imported ${totalImported} questions.`);
  console.log(`\nPool sizes (with cascade):`);
  console.log(`  Last Week:  ${getQuestionCount("last_week")} questions`);
  console.log(`  Last Month: ${getQuestionCount("last_month")} questions`);
  console.log(`  Last Year:  ${getQuestionCount("last_year")} questions`);
  console.log(`  TOTAL:      ${getQuestionCount()}`);
  console.log(`\nCascade: week questions move to month pool after 7 days, then to year pool after 30 days.`);
}

main();

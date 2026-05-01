import { v4 as uuidv4 } from "uuid";
import { fetchCurrentAffairs } from "../lib/news-fetcher";
import { generateQuestions } from "../lib/question-generator";
import { insertQuestions, getQuestionCount } from "../lib/db";
import { type TimePeriod } from "../lib/types";

async function main() {
  const period = (process.argv[2] || "last_week") as TimePeriod;
  const batches = parseInt(process.argv[3] || "5", 10);

  if (!["last_week", "last_month", "last_year"].includes(period)) {
    console.error("Usage: npx tsx scripts/generate-questions.ts [last_week|last_month|last_year] [batches]");
    process.exit(1);
  }

  console.log(`Generating ${batches} batches of 10 questions for period: ${period}`);
  console.log(`Current question count: ${getQuestionCount(period)} for ${period}, ${getQuestionCount()} total`);

  const articles = await fetchCurrentAffairs(period);
  console.log(`Fetched ${articles.length} articles from RSS feeds`);

  if (articles.length === 0) {
    console.log("No articles found. Will use fallback prompt (Claude generates from its knowledge).");
  }

  let totalGenerated = 0;

  for (let i = 0; i < batches; i++) {
    const batchId = uuidv4();
    console.log(`\nBatch ${i + 1}/${batches} (${batchId})...`);

    try {
      const questions = await generateQuestions(articles, period);
      const withPeriod = questions.map((q) => ({ ...q, original_period: period }));
      insertQuestions(withPeriod, batchId);
      totalGenerated += questions.length;
      console.log(`  Generated ${questions.length} questions`);
    } catch (error) {
      console.error(`  Batch ${i + 1} failed:`, error instanceof Error ? error.message : error);
    }

    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\nDone! Generated ${totalGenerated} questions.`);
  console.log(`Total in bank: ${getQuestionCount(period)} for ${period}, ${getQuestionCount()} total`);
}

main().catch(console.error);

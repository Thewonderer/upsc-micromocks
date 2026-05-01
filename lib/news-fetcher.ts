import Parser from "rss-parser";
import { subDays, subMonths, subYears, isAfter } from "date-fns";
import { type TimePeriod, type NewsArticle, type Topic } from "./types";
import { RSS_FEEDS, TOPIC_KEYWORDS } from "./constants";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "UPSC-Mock-Test-App/1.0",
  },
});

function getDateRange(period: TimePeriod): { fromDate: Date; toDate: Date } {
  const toDate = new Date();
  let fromDate: Date;

  switch (period) {
    case "last_week":
      fromDate = subDays(toDate, 7);
      break;
    case "last_month":
      fromDate = subMonths(toDate, 1);
      break;
    case "last_year":
      fromDate = subYears(toDate, 1);
      break;
  }

  return { fromDate, toDate };
}

function classifyArticle(article: NewsArticle): Topic {
  const text = `${article.title} ${article.description}`.toLowerCase();

  let bestTopic: Topic = "current_affairs";
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic as Topic;
    }
  }

  return bestTopic;
}

async function fetchSingleFeed(
  feed: (typeof RSS_FEEDS)[number],
  fromDate: Date
): Promise<NewsArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    const articles: NewsArticle[] = [];

    for (const item of result.items || []) {
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      if (!isAfter(pubDate, fromDate)) continue;

      articles.push({
        title: item.title || "Untitled",
        description: item.contentSnippet || item.content || item.title || "",
        link: item.link || "",
        pubDate: pubDate.toISOString(),
        source: feed.name,
      });
    }

    return articles;
  } catch {
    console.warn(`Failed to fetch feed: ${feed.name}`);
    return [];
  }
}

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.title.toLowerCase().trim().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectBalancedArticles(articles: NewsArticle[]): NewsArticle[] {
  const classified = articles.map((a) => ({
    ...a,
    inferredTopic: classifyArticle(a),
  }));

  const selected: NewsArticle[] = [];
  const topics: Topic[] = [
    "polity",
    "economy",
    "environment",
    "history_culture",
    "current_affairs",
  ];

  for (const topic of topics) {
    const topicArticles = classified
      .filter((a) => a.inferredTopic === topic)
      .sort(
        (a, b) =>
          new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      )
      .slice(0, 4);
    selected.push(...topicArticles);
  }

  if (selected.length < 10) {
    const remaining = classified
      .filter((a) => !selected.find((s) => s.link === a.link))
      .slice(0, 10 - selected.length);
    selected.push(...remaining);
  }

  return selected;
}

export async function fetchCurrentAffairs(
  period: TimePeriod
): Promise<NewsArticle[]> {
  const { fromDate } = getDateRange(period);

  const feedPromises = RSS_FEEDS.map((feed) => fetchSingleFeed(feed, fromDate));
  const feedResults = await Promise.allSettled(feedPromises);

  const freshArticles: NewsArticle[] = [];
  for (const result of feedResults) {
    if (result.status === "fulfilled") {
      freshArticles.push(...result.value);
    }
  }

  const allArticles = deduplicateArticles(freshArticles);
  return selectBalancedArticles(allArticles);
}

export { classifyArticle, getDateRange };

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { type TimePeriod } from "@/lib/types";
import {
  getBalancedQuestions,
  saveTestSession,
  checkGuestUsage,
  recordGuestUsage,
  getQuestionCount,
} from "@/lib/db";
import { headers } from "next/headers";

const GUEST_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const period = body.period as TimePeriod;

    if (!["last_week", "last_month", "last_year"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Use: last_week, last_month, last_year" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const usage = checkGuestUsage(ip, period);
    if (usage >= GUEST_LIMIT) {
      return NextResponse.json(
        {
          error: "free_limit_reached",
          message: `You have used all ${GUEST_LIMIT} free tests for this period. Try a different time period or sign up for more access!`,
        },
        { status: 403 }
      );
    }

    const count = getQuestionCount(period);
    if (count < 10) {
      const totalCount = getQuestionCount();
      if (totalCount < 10) {
        return NextResponse.json(
          {
            error: "no_questions",
            message:
              "Question bank is being prepared. Please check back shortly.",
          },
          { status: 503 }
        );
      }
    }

    const questions = getBalancedQuestions(period);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this period." },
        { status: 503 }
      );
    }

    const testId = uuidv4();
    saveTestSession(
      testId,
      questions.map((q) => q.id)
    );

    recordGuestUsage(ip, period);

    return NextResponse.json({
      testId,
      questions: questions.map(({ correct_answer, explanation, ...q }) => q),
    });
  } catch (error) {
    console.error("Generate test error:", error);
    return NextResponse.json(
      { error: "Failed to generate test. Please try again." },
      { status: 500 }
    );
  }
}

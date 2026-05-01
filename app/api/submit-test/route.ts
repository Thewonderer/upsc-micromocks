import { NextResponse } from "next/server";
import { getTestSession, getQuestionsById } from "@/lib/db";
import { type QuestionResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testId, answers } = body;

    if (!testId || !answers) {
      return NextResponse.json(
        { error: "testId and answers are required" },
        { status: 400 }
      );
    }

    const session = getTestSession(testId);
    if (!session) {
      return NextResponse.json(
        { error: "Test not found or expired" },
        { status: 404 }
      );
    }

    const questions = getQuestionsById(session.questionIds);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Test questions not found" },
        { status: 404 }
      );
    }

    let score = 0;
    const results: QuestionResult[] = questions.map((question, idx) => {
      const userAnswer = answers[idx] || "";
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) score++;

      return {
        ...question,
        id: idx,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
    });

    return NextResponse.json({
      score,
      total: questions.length,
      results,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    return NextResponse.json(
      { error: "Failed to score test" },
      { status: 500 }
    );
  }
}

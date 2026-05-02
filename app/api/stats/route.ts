import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;

  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const users = db
    .prepare("SELECT COUNT(DISTINCT ip) as count FROM guest_usage")
    .get() as { count: number };

  const tests = db
    .prepare("SELECT SUM(tests_taken) as count FROM guest_usage")
    .get() as { count: number };

  const recent = db
    .prepare(
      "SELECT ip, tests_taken, last_test_at FROM guest_usage ORDER BY last_test_at DESC LIMIT 20"
    )
    .all();

  const sessions = db
    .prepare("SELECT COUNT(*) as count FROM test_sessions")
    .get() as { count: number };

  return NextResponse.json({
    unique_users: users.count,
    total_tests_taken: tests.count || 0,
    total_sessions: sessions.count,
    recent_activity: recent,
  });
}

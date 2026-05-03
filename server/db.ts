import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { reports, brands, InsertReport } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Reports queries
export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values(report);
  return result;
}

export async function getReportByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.shareToken, shareToken)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(brands).where(eq(brands.reportId, reportId));
  await db.delete(reports).where(eq(reports.id, reportId));
}

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { reports, brands, InsertReport } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _initialized = false;

export async function getDb() {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("[Database] DATABASE_URL is not set!");
      return null;
    }
    console.log("[Database] Connecting to:", dbUrl.replace(/\/\/.*@/, "//***@"));
    try {
      _db = drizzle(dbUrl);
    } catch (error) {
      console.error("[Database] Failed to create connection:", error);
      _db = null;
      return null;
    }
  }

  // Auto-create tables on first successful connection
  if (_db && !_initialized) {
    try {
      await _db.execute(sql`SELECT 1`);
      console.log("[Database] Connection verified successfully");
      await ensureTables(_db);
      _initialized = true;
    } catch (error) {
      console.error("[Database] Connection test failed:", error);
      _db = null;
      return null;
    }
  }

  return _db;
}

async function ensureTables(db: ReturnType<typeof drizzle>) {
  try {
    // Check if reports table exists
    const result = await db.execute(sql`SHOW TABLES LIKE 'reports'`);
    const rows = result as any;
    if (!rows || !rows[0] || rows[0].length === 0) {
      console.log("[Database] Creating tables...");
      await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
        id int AUTO_INCREMENT NOT NULL,
        openId varchar(64) NOT NULL,
        name text,
        email varchar(320),
        loginMethod varchar(64),
        role enum('user','admin') NOT NULL DEFAULT 'user',
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT users_id PRIMARY KEY(id),
        CONSTRAINT users_openId_unique UNIQUE(openId)
      )`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS reports (
        id int AUTO_INCREMENT NOT NULL,
        userId int NOT NULL,
        shareToken varchar(64) NOT NULL,
        reportName varchar(255) NOT NULL,
        brandCount int NOT NULL,
        reportData json NOT NULL,
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT reports_id PRIMARY KEY(id),
        CONSTRAINT reports_shareToken_unique UNIQUE(shareToken)
      )`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS brands (
        id int AUTO_INCREMENT NOT NULL,
        reportId int NOT NULL,
        brandName varchar(255) NOT NULL,
        pageId varchar(64) NOT NULL,
        brandColor varchar(7) NOT NULL,
        adsCount int NOT NULL,
        cachedData json,
        createdAt timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT brands_id PRIMARY KEY(id)
      )`);
      console.log("[Database] Tables created successfully");
    } else {
      console.log("[Database] Tables already exist");
    }
  } catch (error) {
    console.error("[Database] Failed to ensure tables:", error);
  }
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

import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Reports table - stores generated reports
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(), // For shareable links
  reportName: varchar("reportName", { length: 255 }).notNull(),
  brandCount: int("brandCount").notNull(), // 2 or 3
  reportData: json("reportData").notNull(), // Stores all brands and their data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// Brands table - stores brand info for reports
export const brands = mysqlTable("brands", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  brandName: varchar("brandName", { length: 255 }).notNull(),
  pageId: varchar("pageId", { length: 64 }).notNull(), // Meta Ads Library page ID
  brandColor: varchar("brandColor", { length: 7 }).notNull(), // Hex color
  adsCount: int("adsCount").notNull(),
  cachedData: json("cachedData"), // Cached ads data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

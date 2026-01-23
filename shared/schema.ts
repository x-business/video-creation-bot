import { pgTable, text, varchar, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const platforms = ["reels", "tiktok", "shorts"] as const;
export const tones = ["professional", "casual", "energetic", "emotional"] as const;
export const purposes = ["educational", "explainer", "testimonial", "promotional"] as const;

export const videoProjects = pgTable("video_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  videoLength: integer("video_length").notNull().default(15),
  purpose: text("purpose").notNull(),
  tone: text("tone").notNull(),
  keyPhrase: text("key_phrase"),
  keyword: text("keyword"),
  script: text("script"),
  hookGenerated: boolean("hook_generated").notNull().default(false),
  imageGenerated: boolean("image_generated").notNull().default(false),
  videoGenerated: boolean("video_generated").notNull().default(false),
  audioGenerated: boolean("audio_generated").notNull().default(false),
  editingComplete: boolean("editing_complete").notNull().default(false),
  imagePrompt: text("image_prompt"),
  videoPrompt: text("video_prompt"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertVideoProjectSchema = createInsertSchema(videoProjects).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoProject = z.infer<typeof insertVideoProjectSchema>;
export type VideoProject = typeof videoProjects.$inferSelect;

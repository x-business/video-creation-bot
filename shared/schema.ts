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
  hook: text("hook"), // User uploaded hook text
  hookUrl: text("hook_url"), // URL to uploaded hook file (if any)
  imageGenerated: boolean("image_generated").notNull().default(false),
  imageUrl: text("image_url"), // Generated image URL
  imagePrompt: text("image_prompt"), // Original image prompt from script
  enhancedImagePrompt: text("enhanced_image_prompt"), // AI-enhanced image prompt
  videoGenerated: boolean("video_generated").notNull().default(false),
  videoUrl: text("video_url"), // Generated video URL
  videoPrompt: text("video_prompt"),
  audioGenerated: boolean("audio_generated").notNull().default(false),
  audioUrl: text("audio_url"), // Generated audio URL
  selectedVoiceId: text("selected_voice_id"), // Selected voice for audio/video
  editingComplete: boolean("editing_complete").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertVideoProjectSchema = createInsertSchema(videoProjects).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoProject = z.infer<typeof insertVideoProjectSchema>;
export type VideoProject = typeof videoProjects.$inferSelect;

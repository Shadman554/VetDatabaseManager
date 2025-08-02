import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for local session management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// API response types based on the veterinary API documentation
export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  cover_url: z.string().url().optional(),
  download_url: z.string().url().optional(),
});

export const diseaseSchema = z.object({
  name: z.string().min(1, "Disease name is required"),
  kurdish: z.string().optional(),
  symptoms: z.string().optional(),
  cause: z.string().optional(),
  control: z.string().optional(),
});

export const drugSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  usage: z.string().optional(),
  side_effect: z.string().optional(),
  other_info: z.string().optional(),
  drug_class: z.string().optional(),
});

export const dictionarySchema = z.object({
  name: z.string().min(1, "Word is required"),
  kurdish: z.string().optional(),
  arabic: z.string().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  is_saved: z.boolean().default(false),
  is_favorite: z.boolean().default(false),
});

export const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const normalRangeSchema = z.object({
  name: z.string().min(1, "Range name is required"),
  species: z.string().optional(),
  category: z.string().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const tutorialVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  video_url: z.string().url("Valid URL required"),
  thumbnail_url: z.string().url().optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

export const instrumentSchema = z.object({
  name: z.string().min(1, "Instrument name is required"),
  description: z.string().optional(),
  usage: z.string().optional(),
  category: z.string().optional(),
});

export const noteSchema = z.object({
  name: z.string().min(1, "Note name is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const otherSlideSchema = z.object({
  slide_name: z.string().min(1, "Slide name is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const stoolSlideSchema = z.object({
  slide_name: z.string().min(1, "Slide name is required"),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const urineSlideSchema = z.object({
  name: z.string().min(1, "Slide name is required"),
  description: z.string().optional(),
  findings: z.string().optional(),
  image_url: z.string().url().optional(),
});

export const notificationSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["general", "drug", "disease", "quiz", "update", "reminder"]).default("general"),
  is_read: z.boolean().default(false),
  created_at: z.string().optional(),
});

export const insertNotificationSchema = notificationSchema.omit({ id: true, created_at: true });

export const appLinkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Valid URL required"),
  platform: z.string().optional(),
  description: z.string().optional(),
});

export const aboutSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  version: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Book = z.infer<typeof bookSchema>;
export type Disease = z.infer<typeof diseaseSchema>;
export type Drug = z.infer<typeof drugSchema>;
export type DictionaryWord = z.infer<typeof dictionarySchema>;
export type Staff = z.infer<typeof staffSchema>;
export type NormalRange = z.infer<typeof normalRangeSchema>;
export type TutorialVideo = z.infer<typeof tutorialVideoSchema>;
export type Instrument = z.infer<typeof instrumentSchema>;
export type Note = z.infer<typeof noteSchema>;
export type UrineSlide = z.infer<typeof urineSlideSchema>;
export type OtherSlide = z.infer<typeof otherSlideSchema>;
export type StoolSlide = z.infer<typeof stoolSlideSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AppLink = z.infer<typeof appLinkSchema>;
export type About = z.infer<typeof aboutSchema>;

import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (keeping this from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Image settings table for background removal
export const imageSettings = pgTable("image_settings", {
  id: serial("id").primaryKey(),
  model: text("model").notNull().default("u2net"),
  alphaMatting: boolean("alpha_matting").notNull().default(false),
  foregroundThreshold: integer("foreground_threshold").notNull().default(50),
  backgroundThreshold: integer("background_threshold").notNull().default(50),
  backgroundType: text("background_type").notNull().default("transparent"),
  backgroundColor: text("background_color").notNull().default("#ffffff"),
  backgroundImage: text("background_image"),
  allowResize: boolean("allow_resize").notNull().default(true),
  allowMove: boolean("allow_move").notNull().default(true),
});

export const insertImageSettingsSchema = createInsertSchema(imageSettings).omit({
  id: true,
});

export type InsertImageSettings = z.infer<typeof insertImageSettingsSchema>;
export type ImageSettings = typeof imageSettings.$inferSelect;

// Define supported models
export const backgroundRemovalModels = ["u2net", "u2netp", "u2net_human_seg"] as const;
export type BackgroundRemovalModel = typeof backgroundRemovalModels[number];

// Define background types
export const backgroundTypes = ["transparent", "color", "image"] as const;
export type BackgroundType = typeof backgroundTypes[number];

// Settings validation schema for the frontend
export const settingsSchema = z.object({
  model: z.enum(backgroundRemovalModels),
  alphaMatting: z.boolean(),
  foregroundThreshold: z.number().min(0).max(100),
  backgroundThreshold: z.number().min(0).max(100),
  backgroundType: z.enum(backgroundTypes).default("transparent"),
  backgroundColor: z.string().default("#ffffff"),
  backgroundImage: z.string().optional(),
  allowResize: z.boolean().default(true),
  allowMove: z.boolean().default(true),
});

// Ensure the validation schema for settings
export type Settings = z.infer<typeof settingsSchema>;

// Image output format
export const imageFormats = ["png", "jpg"] as const;
export type ImageFormat = typeof imageFormats[number];

// Image quality
export const imageQualities = ["high", "medium", "low"] as const;
export type ImageQuality = typeof imageQualities[number];

// Download options
export const downloadOptionsSchema = z.object({
  format: z.enum(imageFormats),
  quality: z.enum(imageQualities),
});

export type DownloadOptions = z.infer<typeof downloadOptionsSchema>;

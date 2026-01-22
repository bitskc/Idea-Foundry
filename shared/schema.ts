import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // B2B SaaS, B2C Mobile App, Marketplace, etc.
  status: text("status").notNull().default("draft"), // draft, in_progress, completed (workflow status)
  ideaStatus: text("idea_status").notNull().default("exploring"), // exploring, active, backburner, archived
  progress: integer("progress").notNull().default(0),
  rawIdea: text("raw_idea").notNull(),
  startMode: text("start_mode").notNull().default("idea"), // "idea" or "problem"
  conversationMode: text("conversation_mode").notNull().default("supportive"), // "supportive" or "challenger"
  prdContent: text("prd_content"), // Generated PRD markdown
  notes: text("notes"), // User's quick notes about the idea
  targetAvatar: jsonb("target_avatar"), // Customer avatar: { role, industry, painPoints, goals, demographics, behaviors }
  viabilityScore: integer("viability_score"), // 1-10 score
  viabilityBreakdown: jsonb("viability_breakdown"), // { marketSize, competition, effort, profitPotential }
  competitors: jsonb("competitors"), // Array of competitor objects
  keyInsights: jsonb("key_insights"), // Array of insight strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  currentSection: text("current_section").notNull().default("Problem Statement"),
  currentStep: integer("current_step").notNull().default(0),
  answers: jsonb("answers").notNull().default({}), // Store all user answers as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "ai"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

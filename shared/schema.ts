import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches Supabase auth.users.id
  email: text("email").notNull().unique(),
  username: text("username"),
  password: text("password"), // bcrypt hash (JWT auth)
  subscriptionStatus: text("subscription_status").notNull().default("free"), // 'free' | 'pro'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // B2B SaaS, B2C Mobile App, Marketplace, etc.
  status: text("status").notNull().default("draft"), // draft, in_progress, completed (workflow status)
  ideaStatus: text("idea_status").notNull().default("exploring"), // exploring, active, backburner, archived
  progress: integer("progress").notNull().default(0),
  rawIdea: text("raw_idea").notNull(),
  startMode: text("start_mode").notNull().default("idea"), // "idea" or "problem"
  conversationMode: text("conversation_mode").notNull().default("supportive"), // "supportive" or "challenger"
  discoveryPath: text("discovery_path").default("idea_first"), // "idea_first" or "audience_first"
  ideaPurpose: text("idea_purpose").default("monetize"), // "monetize", "internal", or "personal"
  prdContent: text("prd_content"), // Generated PRD markdown
  notes: text("notes"), // User's quick notes about the idea
  targetAvatar: jsonb("target_avatar"), // Customer avatar: { role, industry, painPoints, goals, demographics, behaviors }
  viabilityScore: integer("viability_score"), // 1-10 score
  viabilityBreakdown: jsonb("viability_breakdown"), // { marketSize, competition, effort, profitPotential }
  competitors: jsonb("competitors"), // Array of competitor objects
  keyInsights: jsonb("key_insights"), // Array of insight strings
  githubRepoUrl: text("github_repo_url"), // Optional GitHub repository URL
  synergyAnalysis: jsonb("synergy_analysis"), // Cached synergy report
  techStack: jsonb("tech_stack"), // User's selected/saved tech stack
  techStackRecommendation: jsonb("tech_stack_recommendation"), // AI recommendation cache
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

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(), // SHA-256 hash of token
  name: text("name").notNull(), // User-friendly name like "Cursor MCP"
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const userApiKeys = pgTable("user_api_keys", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'gemini' | 'anthropic' | 'openai'
  encryptedKey: text("encrypted_key").notNull(), // AES-256-GCM encrypted
  model: text("model"), // User-selected model (null = provider default)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const userModelPreferences = pgTable("user_model_preferences", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  task: text("task").notNull(), // AI task key (see AI_TASKS)
  provider: text("provider").notNull(), // 'gemini' | 'anthropic'
  model: text("model"), // Specific model (null = provider default)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  username: true,
  password: true,
  subscriptionStatus: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
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

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertUserApiKeySchema = createInsertSchema(userApiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertUserModelPreferenceSchema = createInsertSchema(userModelPreferences).omit({
  id: true,
  updatedAt: true,
});
export const insertApiTokenSchema = createInsertSchema(apiTokens).omit({
  id: true,
  createdAt: true,
  tokenHash: true,
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

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type ApiToken = typeof apiTokens.$inferSelect;
export type InsertApiToken = z.infer<typeof insertApiTokenSchema>;
export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = z.infer<typeof insertUserApiKeySchema>;
export type UserModelPreference = typeof userModelPreferences.$inferSelect;
export type InsertUserModelPreference = z.infer<typeof insertUserModelPreferenceSchema>;

// Tech Stack Types
export interface TechStackItem {
  name: string;
  notes?: string;
  aiRecommended?: boolean;
}

export interface TechStack {
  frontend?: TechStackItem;
  backend?: TechStackItem;
  database?: TechStackItem;
  hosting?: TechStackItem;
  auth?: TechStackItem;
  payments?: TechStackItem;
  other?: TechStackItem[];
}

export interface TechStackRecommendationItem {
  name: string;
  reason: string;
}

export interface TechStackRecommendation {
  recommended: {
    frontend?: TechStackRecommendationItem;
    backend?: TechStackRecommendationItem;
    database?: TechStackRecommendationItem;
    hosting?: TechStackRecommendationItem;
    auth?: TechStackRecommendationItem;
    payments?: TechStackRecommendationItem;
  };
  fullStack?: {
    name: string;
    reason: string;
  };
  aiAssistants?: Array<{
    name: string;
    bestFor: string;
    tip?: string;
  }>;
  mvpTimeline?: string;
  costEstimate?: string;
  warnings?: string[];
}

// Zod schemas for API validation
export const TechStackItemSchema = z.object({
  name: z.string(),
  notes: z.string().optional(),
  aiRecommended: z.boolean().optional(),
});

export const TechStackSchema = z.object({
  frontend: TechStackItemSchema.optional(),
  backend: TechStackItemSchema.optional(),
  database: TechStackItemSchema.optional(),
  hosting: TechStackItemSchema.optional(),
  auth: TechStackItemSchema.optional(),
  payments: TechStackItemSchema.optional(),
  other: z.array(TechStackItemSchema).optional(),
});

export const TechStackRecommendationItemSchema = z.object({
  name: z.string(),
  reason: z.string(),
});

export const TechStackRecommendationSchema = z.object({
  recommended: z.object({
    frontend: TechStackRecommendationItemSchema.optional(),
    backend: TechStackRecommendationItemSchema.optional(),
    database: TechStackRecommendationItemSchema.optional(),
    hosting: TechStackRecommendationItemSchema.optional(),
    auth: TechStackRecommendationItemSchema.optional(),
    payments: TechStackRecommendationItemSchema.optional(),
  }),
  fullStack: z.object({
    name: z.string(),
    reason: z.string(),
  }).optional(),
  aiAssistants: z.array(z.object({
    name: z.string(),
    bestFor: z.string(),
    tip: z.string().optional(),
  })).optional(),
  mvpTimeline: z.string().optional(),
  costEstimate: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

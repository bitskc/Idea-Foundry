import {
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Note,
  type InsertNote,
  type ApiToken,
  type InsertApiToken,
  type UserApiKey,
  type UserModelPreference,
  users,
  projects,
  conversations,
  messages,
  notes,
  apiTokens,
  userApiKeys,
  userModelPreferences,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Project methods
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  countProjectsByUserId(userId: string): Promise<number>;

  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByProjectId(projectId: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;

  // Message methods
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Note methods
  getNotesByProject(projectId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // API Token methods
  getApiTokensByUserId(userId: string): Promise<Omit<ApiToken, 'tokenHash'>[]>;
  getApiTokenByHash(tokenHash: string): Promise<ApiToken | undefined>;
  createApiToken(token: InsertApiToken): Promise<{ token: string; metadata: Omit<ApiToken, 'tokenHash'> }>;
  updateApiTokenLastUsed(id: number): Promise<void>;
  deleteApiToken(id: number): Promise<void>;
  // User API Key methods (BYOK)
  getUserApiKeys(userId: string): Promise<{ id: number; provider: string; maskedKey: string; model: string | null; createdAt: Date; lastUsedAt: Date | null }[]>;
  getUserApiKey(userId: string, provider: string): Promise<{ key: string; model: string | null } | null>;
  createUserApiKey(userId: string, provider: string, encryptedKey: string, model?: string | null): Promise<{ id: number; provider: string; maskedKey: string; model: string | null; createdAt: Date; lastUsedAt: Date | null }>;
  updateUserApiKeyModel(id: number, userId: string, model: string | null): Promise<void>;
  // User model preference methods
  getUserModelPreferences(userId: string): Promise<{ id: number; task: string; provider: string; model: string | null }[]>;
  upsertUserModelPreference(userId: string, task: string, provider: string, model: string | null): Promise<{ id: number; task: string; provider: string; model: string | null }>;
  deleteUserApiKey(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: { email: insertUser.email },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) throw new Error("User not found");
    return user;
  }

  // Project methods
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async countProjectsByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.userId, userId));
    return result?.count ?? 0;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.projectId, projectId));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  // Message methods
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Note methods
  async getNotesByProject(projectId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.projectId, projectId)).orderBy(desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // API Token methods
  async getApiTokensByUserId(userId: string): Promise<Omit<ApiToken, 'tokenHash'>[]> {
    const tokens = await db.select({
      id: apiTokens.id,
      userId: apiTokens.userId,
      name: apiTokens.name,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
      expiresAt: apiTokens.expiresAt,
    }).from(apiTokens).where(eq(apiTokens.userId, userId)).orderBy(desc(apiTokens.createdAt));
    return tokens;
  }

  async getApiTokenByHash(tokenHash: string): Promise<ApiToken | undefined> {
    const [token] = await db.select().from(apiTokens).where(eq(apiTokens.tokenHash, tokenHash));
    return token;
  }

  async createApiToken(token: InsertApiToken): Promise<{ token: string; metadata: Omit<ApiToken, 'tokenHash'> }> {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const fullToken = `if_sk_${randomBytes}`; // SEC-003: Add identifiable prefix
    const tokenHash = crypto.createHash('sha256').update(fullToken).digest('hex');

    const [created] = await db.insert(apiTokens).values({
      ...token,
      tokenHash,
    }).returning();

    return {
      token: fullToken,
      metadata: {
        id: created.id,
        userId: created.userId,
        name: created.name,
        lastUsedAt: created.lastUsedAt,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
      }
    };
  }

  async updateApiTokenLastUsed(id: number): Promise<void> {
    await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, id));
  }

  async deleteApiToken(id: number): Promise<void> {
    await db.delete(apiTokens).where(eq(apiTokens.id, id));
  }

  // User API Key methods (BYOK)
  async getUserApiKeys(userId: string): Promise<{ id: number; provider: string; maskedKey: string; model: string | null; createdAt: Date; lastUsedAt: Date | null }[]> {
    const keys = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
    const { decrypt, maskKey } = await import("./crypto");
    return keys.map(k => {
      let masked = "****";
      try {
        const plaintext = decrypt(k.encryptedKey);
        masked = maskKey(plaintext);
      } catch {
        masked = "****";
      }
      return {
        id: k.id,
        provider: k.provider,
        maskedKey: masked,
        model: k.model,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
      };
    });
  }

  async getUserApiKey(userId: string, provider: string): Promise<{ key: string; model: string | null } | null> {
    const [key] = await db.select().from(userApiKeys)
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
    if (!key) return null;
    const { decrypt } = await import("./crypto");
    return { key: decrypt(key.encryptedKey), model: key.model };
  }

  async createUserApiKey(userId: string, provider: string, encryptedKey: string, model?: string | null): Promise<{ id: number; provider: string; maskedKey: string; model: string | null; createdAt: Date; lastUsedAt: Date | null }> {
    // Delete existing key for this provider first (one key per provider per user)
    await db.delete(userApiKeys).where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
    const [created] = await db.insert(userApiKeys).values({
      userId,
      provider,
      encryptedKey,
      model: model || null,
    }).returning();
    const { decrypt, maskKey } = await import("./crypto");
    let masked = "****";
    try {
      masked = maskKey(decrypt(encryptedKey));
    } catch { /* */ }
    return {
      id: created.id,
      provider: created.provider,
      maskedKey: masked,
      model: created.model,
      createdAt: created.createdAt,
      lastUsedAt: created.lastUsedAt,
    };
  }

  async updateUserApiKeyModel(id: number, userId: string, model: string | null): Promise<void> {
    await db.update(userApiKeys).set({ model }).where(and(eq(userApiKeys.id, id), eq(userApiKeys.userId, userId)));
  }

  // User model preference methods
  async getUserModelPreferences(userId: string): Promise<{ id: number; task: string; provider: string; model: string | null }[]> {
    const prefs = await db.select().from(userModelPreferences).where(eq(userModelPreferences.userId, userId));
    return prefs.map(p => ({
      id: p.id,
      task: p.task,
      provider: p.provider,
      model: p.model,
    }));
  }

  async upsertUserModelPreference(userId: string, task: string, provider: string, model: string | null): Promise<{ id: number; task: string; provider: string; model: string | null }> {
    // Delete existing preference for this task, then insert
    await db.delete(userModelPreferences).where(and(eq(userModelPreferences.userId, userId), eq(userModelPreferences.task, task)));
    const [created] = await db.insert(userModelPreferences).values({
      userId,
      task,
      provider,
      model,
    }).returning();
    return {
      id: created.id,
      task: created.task,
      provider: created.provider,
      model: created.model,
    };
  }

  async deleteUserApiKey(id: number, userId: string): Promise<void> {
    await db.delete(userApiKeys).where(and(eq(userApiKeys.id, id), eq(userApiKeys.userId, userId)));
  }
}

export const storage = new DatabaseStorage();

import { isDevMode } from "./middleware/auth";
import { mockStorage } from "./storage-mock";

/**
 * Shared storage selection — used by routes.ts, mcp/index.ts, mcp/auth.ts.
 * Dev mode (no DATABASE_URL) uses in-memory mock; production uses Drizzle/Postgres.
 */
export function getStorage(): IStorage {
  return isDevMode ? mockStorage : storage;
}

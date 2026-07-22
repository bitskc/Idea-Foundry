/**
 * In-memory mock storage for local development without a database
 */
import type { 
  User, InsertUser, Project, InsertProject, 
  Conversation, InsertConversation, Message, InsertMessage,
  Note, InsertNote, ApiToken, InsertApiToken
} from "../shared/schema";
import type { IStorage } from "./storage";
import crypto from "crypto";

// In-memory data stores
const users = new Map<string, User>();
const projects = new Map<number, Project>();
const conversations = new Map<number, Conversation>();
const messages = new Map<number, Message>();
const notes = new Map<number, Note>();
const apiTokens = new Map<number, ApiToken & { tokenHash: string }>();

let projectIdCounter = 1;
let conversationIdCounter = 1;
let messageIdCounter = 1;
let noteIdCounter = 1;
let tokenIdCounter = 1;

// Create default dev user
const DEV_USER_ID = "dev-user-00000000-0000-0000-0000-000000000001";
users.set(DEV_USER_ID, {
  id: DEV_USER_ID,
  email: "dev@example.com",
  username: "devuser",
  password: null,
  subscriptionStatus: "pro",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
});

// Create sample project for testing
const sampleProject: Project = {
  id: projectIdCounter++,
  userId: DEV_USER_ID,
  title: "Sample Idea for Testing",
  description: "A sample idea to test the local development environment",
  type: "B2B SaaS",
  status: "draft",
  ideaStatus: "exploring",
  progress: 0,
  rawIdea: "I want to build a tool that helps developers test their apps locally without needing cloud services",
  startMode: "idea",
  conversationMode: "supportive",
  discoveryPath: "idea_first",
  ideaPurpose: "monetize",
  prdContent: `# Sample PRD

## Overview
This is a sample PRD for testing.

## User Stories

### US-001: Local Development Mode
As a developer, I want to run the app locally without cloud dependencies.

**Acceptance Criteria:**
- [ ] App starts without Supabase credentials
- [ ] Mock data is available for testing
- [ ] All UI components render correctly

### US-002: API Token Management
As a user, I want to create API tokens for MCP integration.

**Acceptance Criteria:**
- [ ] Can create tokens with names
- [ ] Token shown only once
- [ ] Can delete tokens
`,
  notes: "This is a sample project for local testing",
  targetAvatar: null,
  viabilityScore: 7,
  viabilityBreakdown: { marketSize: 8, competition: 6, effort: 5, profitPotential: 8 },
  competitors: [{ name: "LocalStack", description: "AWS local emulator" }],
  keyInsights: ["Great for indie developers", "Low barrier to entry"],
  githubRepoUrl: "https://github.com/example/sample-repo",
  synergyAnalysis: null,
  techStack: null,
  techStackRecommendation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
projects.set(sampleProject.id, sampleProject);

// Create sample conversation
const sampleConversation: Conversation = {
  id: conversationIdCounter++,
  projectId: sampleProject.id,
  currentSection: "Problem Statement",
  currentStep: 0,
  answers: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};
conversations.set(sampleConversation.id, sampleConversation);

export class MockStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(users.values()).find(u => u.email === email);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(users.values()).find(u => u.stripeCustomerId === customerId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: user.id || crypto.randomUUID(),
      email: user.email,
      username: user.username || null,
      password: user.password || null,
      subscriptionStatus: user.subscriptionStatus || "free",
      stripeCustomerId: user.stripeCustomerId || null,
      stripeSubscriptionId: user.stripeSubscriptionId || null,
    };
    users.set(newUser.id, newUser);
    return newUser;
  }

  async upsertUser(user: InsertUser): Promise<User> {
    const existing = await this.getUser(user.id!);
    if (existing) {
      return this.updateUser(user.id!, user);
    }
    return this.createUser(user);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...updates };
    users.set(id, updated);
    return updated;
  }

  // Project methods
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(projects.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: projectIdCounter++,
      ...project,
      status: project.status || "draft",
      ideaStatus: project.ideaStatus || "exploring",
      progress: project.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project;
    projects.set(newProject.id, newProject);
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    projects.delete(id);
  }

  async countProjectsByUserId(userId: string): Promise<number> {
    return Array.from(projects.values()).filter(p => p.userId === userId).length;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return conversations.get(id);
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    return Array.from(conversations.values()).find(c => c.projectId === projectId);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConversation: Conversation = {
      id: conversationIdCounter++,
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Conversation;
    conversations.set(newConversation.id, newConversation);
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const conversation = conversations.get(id);
    if (!conversation) return undefined;
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    conversations.set(id, updated);
    return updated;
  }

  // Message methods
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: messageIdCounter++,
      ...message,
      createdAt: new Date(),
    } as Message;
    messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getNotesByProject(projectId: number): Promise<Note[]> {
    return Array.from(notes.values())
      .filter(n => n.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNote(id: number): Promise<Note | undefined> {
    return notes.get(id);
  }

  async deleteNote(id: number): Promise<void> {
    notes.delete(id);
  }

  async createNote(note: InsertNote): Promise<Note> {
    const newNote: Note = {
      id: noteIdCounter++,
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Note;
    notes.set(newNote.id, newNote);
    return newNote;
  }

  async updateNote(id: number, updates: Partial<InsertNote>): Promise<Note | undefined> {
    const note = notes.get(id);
    if (!note) return undefined;
    const updated = { ...note, ...updates, updatedAt: new Date() };
    notes.set(id, updated);
    return updated;
  }


  // API Token methods
  async getApiTokensByUserId(userId: string): Promise<Omit<ApiToken, 'tokenHash'>[]> {
    return Array.from(apiTokens.values())
      .filter(t => t.userId === userId)
      .map(({ tokenHash, ...rest }) => rest);
  }

  async getApiTokenByHash(hash: string): Promise<ApiToken | undefined> {
    return Array.from(apiTokens.values()).find(t => t.tokenHash === hash);
  }

  async createApiToken(token: InsertApiToken): Promise<{ token: string; metadata: Omit<ApiToken, 'tokenHash'> }> {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const fullToken = `if_sk_${randomBytes}`;
    const tokenHash = crypto.createHash('sha256').update(fullToken).digest('hex');

    const newToken = {
      id: tokenIdCounter++,
      userId: token.userId,
      tokenHash,
      name: token.name,
      lastUsedAt: null,
      createdAt: new Date(),
      expiresAt: token.expiresAt || null,
    };
    apiTokens.set(newToken.id, newToken);

    return {
      token: fullToken,
      metadata: {
        id: newToken.id,
        userId: newToken.userId,
        name: newToken.name,
        lastUsedAt: newToken.lastUsedAt,
        createdAt: newToken.createdAt,
        expiresAt: newToken.expiresAt,
      }
    };
  }

  async updateApiTokenLastUsed(id: number): Promise<void> {
    const token = apiTokens.get(id);
    if (token) {
      token.lastUsedAt = new Date();
    }
  }
  async deleteApiToken(id: number): Promise<void> {
    apiTokens.delete(id);
  }
}

export const mockStorage = new MockStorage();

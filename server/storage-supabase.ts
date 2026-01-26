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
} from "../shared/schema";
import { supabaseAdmin } from "./supabase";
import type { IStorage } from "./storage";

/**
 * Supabase-based storage implementation
 * Uses @supabase/supabase-js REST API (works on Vercel + Supabase free tier)
 */
export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(insertUser, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  // Project methods
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Project[];
  }

  async countProjectsByUserId(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data as Project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Project;
  }

  async deleteProject(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Conversation;
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const { data, error} = await supabaseAdmin
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    if (error) throw error;
    return data as Conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Conversation;
  }

  // Message methods
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data as Message;
  }

  // Note methods
  async getNotesByProject(projectId: number): Promise<Note[]> {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Note[];
  }

  async getNote(id: number): Promise<Note | undefined> {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert(note)
      .select()
      .single();
    
    if (error) throw error;
    return data as Note;
  }

  async deleteNote(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const storage: IStorage = new SupabaseStorage();

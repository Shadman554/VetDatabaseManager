import { users, type User, type InsertUser, type Note } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllNotes(): Promise<Note[]>;
  getNoteByName(name: string): Promise<Note | undefined>;
  createNote(note: Note): Promise<Note>;
  updateNote(name: string, note: Note): Promise<Note | undefined>;
  deleteNote(name: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<string, Note>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.currentId = 1;
    
    // Create default admin user for testing
    this.createUser({
      username: "admin",
      password: "admin123" // In production, this should be hashed
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isActive: true,
      isAdmin: true,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async getNoteByName(name: string): Promise<Note | undefined> {
    return this.notes.get(name);
  }

  async createNote(note: Note): Promise<Note> {
    this.notes.set(note.name, note);
    return note;
  }

  async updateNote(name: string, noteData: Note): Promise<Note | undefined> {
    const existingNote = this.notes.get(name);
    if (!existingNote) {
      return undefined;
    }
    
    // If name is changing, delete old entry and create new one
    if (noteData.name !== name) {
      this.notes.delete(name);
    }
    
    this.notes.set(noteData.name, noteData);
    return noteData;
  }

  async deleteNote(name: string): Promise<boolean> {
    return this.notes.delete(name);
  }
}

export const storage = new MemStorage();

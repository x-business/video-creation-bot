import { type User, type InsertUser, type VideoProject, type InsertVideoProject } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProjects(): Promise<VideoProject[]>;
  getProject(id: number): Promise<VideoProject | undefined>;
  createProject(project: InsertVideoProject): Promise<VideoProject>;
  updateProject(id: number, updates: Partial<InsertVideoProject>): Promise<VideoProject | undefined>;
  deleteProject(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<number, VideoProject>;
  private projectIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.projectIdCounter = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProjects(): Promise<VideoProject[]> {
    return Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProject(id: number): Promise<VideoProject | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertVideoProject): Promise<VideoProject> {
    const id = this.projectIdCounter++;
    const project: VideoProject = {
      id,
      title: insertProject.title,
      platform: insertProject.platform,
      videoLength: insertProject.videoLength ?? 15,
      purpose: insertProject.purpose,
      tone: insertProject.tone,
      keyPhrase: insertProject.keyPhrase ?? null,
      keyword: insertProject.keyword ?? null,
      script: insertProject.script ?? null,
      hookGenerated: insertProject.hookGenerated ?? false,
      imageGenerated: insertProject.imageGenerated ?? false,
      videoGenerated: insertProject.videoGenerated ?? false,
      audioGenerated: insertProject.audioGenerated ?? false,
      editingComplete: insertProject.editingComplete ?? false,
      imagePrompt: insertProject.imagePrompt ?? null,
      videoPrompt: insertProject.videoPrompt ?? null,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertVideoProject>): Promise<VideoProject | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: VideoProject = { ...existing, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
}

export const storage = new MemStorage();

import { type User, type InsertUser, type VideoProject, type InsertVideoProject } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage file path
const STORAGE_FILE = path.join(__dirname, "../data/storage.json");

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

interface StorageData {
  users: Record<string, User>;
  projects: Record<number, VideoProject>;
  projectIdCounter: number;
}

export class LocalFileStorage implements IStorage {
  private data: StorageData;
  private storageFile: string;

  constructor(storagePath: string = STORAGE_FILE) {
    this.storageFile = storagePath;
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storageFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load existing data or initialize empty
      if (fs.existsSync(this.storageFile)) {
        const fileContent = fs.readFileSync(this.storageFile, "utf-8");
        const parsed = JSON.parse(fileContent);
        
        // Convert date strings back to Date objects
        const projects: Record<number, VideoProject> = {};
        for (const [id, project] of Object.entries(parsed.projects || {})) {
          projects[Number(id)] = {
            ...(project as any),
            createdAt: new Date((project as any).createdAt),
          };
        }

        return {
          users: parsed.users || {},
          projects,
          projectIdCounter: parsed.projectIdCounter || 1,
        };
      }
    } catch (error) {
      console.error("Error loading storage file:", error);
    }

    // Return empty data if file doesn't exist or error occurred
    return {
      users: {},
      projects: {},
      projectIdCounter: 1,
    };
  }

  private saveData(): void {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storageFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Convert Date objects to ISO strings for JSON serialization
      const projectsToSave: Record<string, any> = {};
      for (const [id, project] of Object.entries(this.data.projects)) {
        projectsToSave[id] = {
          ...project,
          createdAt: project.createdAt.toISOString(),
        };
      }

      const dataToSave = {
        users: this.data.users,
        projects: projectsToSave,
        projectIdCounter: this.data.projectIdCounter,
      };

      fs.writeFileSync(this.storageFile, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving storage file:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.data.users[id];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(this.data.users).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.data.users[id] = user;
    this.saveData();
    return user;
  }

  async getProjects(): Promise<VideoProject[]> {
    return Object.values(this.data.projects).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProject(id: number): Promise<VideoProject | undefined> {
    return this.data.projects[id];
  }

  async createProject(insertProject: InsertVideoProject): Promise<VideoProject> {
    const id = this.data.projectIdCounter++;
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
      hook: insertProject.hook ?? null,
      hookUrl: insertProject.hookUrl ?? null,
      imageGenerated: insertProject.imageGenerated ?? false,
      imageUrl: insertProject.imageUrl ?? null,
      imagePrompt: insertProject.imagePrompt ?? null,
      enhancedImagePrompt: insertProject.enhancedImagePrompt ?? null,
      videoGenerated: insertProject.videoGenerated ?? false,
      videoUrl: insertProject.videoUrl ?? null,
      videoPrompt: insertProject.videoPrompt ?? null,
      audioGenerated: insertProject.audioGenerated ?? false,
      audioUrl: insertProject.audioUrl ?? null,
      selectedVoiceId: insertProject.selectedVoiceId ?? null,
      editingComplete: insertProject.editingComplete ?? false,
      createdAt: new Date(),
    };
    this.data.projects[id] = project;
    this.saveData();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertVideoProject>): Promise<VideoProject | undefined> {
    const existing = this.data.projects[id];
    if (!existing) return undefined;
    
    const updated: VideoProject = { ...existing, ...updates };
    this.data.projects[id] = updated;
    this.saveData();
    return updated;
  }

  async deleteProject(id: number): Promise<boolean> {
    if (!this.data.projects[id]) return false;
    delete this.data.projects[id];
    this.saveData();
    return true;
  }
}

// Use LocalFileStorage instead of MemStorage
export const storage = new LocalFileStorage();

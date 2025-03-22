import { 
  imageSettings, 
  type ImageSettings, 
  type InsertImageSettings, 
  users, 
  type User, 
  type InsertUser 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Image settings operations
  getDefaultSettings(): Promise<ImageSettings>;
  updateSettings(settings: InsertImageSettings): Promise<ImageSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private settings: ImageSettings;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    
    // Default settings
    this.settings = {
      id: 1,
      model: "u2net",
      alphaMatting: false,
      foregroundThreshold: 50,
      backgroundThreshold: 50,
      backgroundType: "transparent",
      backgroundColor: "#ffffff",
      backgroundImage: "",
      allowResize: true,
      allowMove: true,
    };
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getDefaultSettings(): Promise<ImageSettings> {
    return this.settings;
  }
  
  async updateSettings(newSettings: InsertImageSettings): Promise<ImageSettings> {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    return this.settings;
  }
}

export const storage = new MemStorage();

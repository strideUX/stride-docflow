import path from 'path';
import os from 'os';
import fs from 'fs-extra';

export interface UserConfig {
  defaultProjectDirectory: string;
  mcpServers?: Array<{
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

const DEFAULT_CONFIG: UserConfig = {
  defaultProjectDirectory: path.join(os.homedir(), 'Documents/Work/Clients/DocFlow')
};

const CONFIG_DIR = path.join(os.homedir(), '.docflow');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

class UserConfigManager {
  private config: UserConfig | null = null;

  async loadConfig(): Promise<UserConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      await fs.ensureDir(CONFIG_DIR);
      
      if (await fs.pathExists(CONFIG_FILE)) {
        const fileContent = await fs.readJson(CONFIG_FILE);
        this.config = { ...DEFAULT_CONFIG, ...fileContent };
      } else {
        // Create default config file
        this.config = DEFAULT_CONFIG;
        await this.saveConfig();
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error instanceof Error ? error.message : 'Unknown error');
      this.config = DEFAULT_CONFIG;
    }

    return this.config!; // We always assign it above
  }

  async saveConfig(): Promise<void> {
    const config = this.config || DEFAULT_CONFIG;
    
    try {
      await fs.ensureDir(CONFIG_DIR);
      await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    } catch (error) {
      console.warn('Failed to save config:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateConfig(updates: Partial<UserConfig>): Promise<void> {
    const config = await this.loadConfig();
    this.config = { ...config, ...updates };
    await this.saveConfig();
  }

  async getDefaultProjectDirectory(): Promise<string> {
    const config = await this.loadConfig();
    
    // Expand ~ to home directory
    let dir = config.defaultProjectDirectory;
    if (dir.startsWith('~')) {
      dir = path.join(os.homedir(), dir.slice(1));
    }
    
    // Ensure directory exists
    await fs.ensureDir(dir);
    
    return dir;
  }

  getConfigPath(): string {
    return CONFIG_FILE;
  }
}

export const userConfig = new UserConfigManager();
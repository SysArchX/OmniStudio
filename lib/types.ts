export type ViewId = "chat" | "studio" | "agent" | "settings" | "credits";

export type ProviderId = "groq" | "openrouter";

export interface ApiKeys {
  groq: string;
  openrouter: string;
}

export type ThemeId = "obsidian" | "midnight" | "light";
export type Density = "compact" | "comfortable";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export interface GithubConfig {
  token: string;
  repo: string;
}

export interface AppSettings {
  keys: ApiKeys;
  fallback: boolean;
  theme: ThemeId;
  accent: string;
  density: Density;
  performance: boolean;
  voiceURI: string | null;
  rate: number;
  sfxVolume: number;
  profile: { name: string; email: string };
  supabase: SupabaseConfig;
  github: GithubConfig;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  sources?: Array<{ title: string; url: string }>;
  at: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export type EnvId =
  | "jungle_quicksand"
  | "deep_ocean"
  | "urban_storm"
  | "arctic_snow"
  | "minimal_studio"
  | "escritorio_tech";

export type AnimId =
  | "running_panic"
  | "sinking_struggle"
  | "floating_calm"
  | "curled_protect"
  | "impact_xray"
  | "victory_safe";

export interface VideoScene {
  id: string;
  text: string;
  env: EnvId;
  anim: AnimId;
  duration: number;
}

export interface StudioProject {
  topic: string;
  title: string;
  scenes: VideoScene[];
  voiceURI: string | null;
  rate: number;
  sfxEnabled: boolean;
}

export interface NativeBridge {
  platform: string;
  runCommand: (command: string) => Promise<{ code: number; stdout: string; stderr: string }>;
  listDir: (path: string) => Promise<Array<{ name: string; isDir: boolean }>>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  homeDir?: () => Promise<string>;
  onAuthCallback?: (callback: (url: string) => void) => () => void;
}

export interface AgentStep {
  id: string;
  title: string;
  status: "pending" | "running" | "done" | "failed";
  detail?: string;
}

export interface AgentLogEntry {
  id: string;
  kind: "plan" | "tool" | "result" | "answer" | "error";
  text: string;
  at: number;
}

export interface SkillDefinition {
  name: string;
  description: string;
  instructions: string;
  source: string;
}

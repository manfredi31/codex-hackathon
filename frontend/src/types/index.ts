export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface GameRecord {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
}

export interface GenerateResponse {
  runId: string;
}

export interface RunEvent {
  type: string;
  runId: string;
  slug: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

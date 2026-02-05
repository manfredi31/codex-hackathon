import type { ChatMessage, GameRecord, GenerateResponse } from '../types';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function listGames(): Promise<GameRecord[]> {
  const response = await fetch('/api/games');
  return parseResponse<GameRecord[]>(response);
}

export async function getGame(slug: string): Promise<GameRecord> {
  const response = await fetch(`/api/games/${slug}`);
  return parseResponse<GameRecord>(response);
}

export async function createGame(title: string): Promise<GameRecord> {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });

  return parseResponse<GameRecord>(response);
}

export async function generateGame(slug: string, prompt: string, chatContext: ChatMessage[]): Promise<GenerateResponse> {
  const response = await fetch(`/api/games/${slug}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, chatContext })
  });

  return parseResponse<GenerateResponse>(response);
}

export async function cancelRun(runId: string): Promise<void> {
  const response = await fetch(`/api/runs/${runId}/cancel`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel run ${runId}`);
  }
}

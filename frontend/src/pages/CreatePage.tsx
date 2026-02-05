import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { cancelRun, createGame, generateGame, getGame } from '../lib/api';
import type { ChatMessage, GameRecord, RunEvent } from '../types';

interface ChatEntry {
  id: string;
  role: ChatMessage['role'];
  content: string;
}

function nextId() {
  return Math.random().toString(36).slice(2, 10);
}

function toHumanCodexEvent(event: unknown): string {
  if (!event || typeof event !== 'object') {
    return 'Codex event received';
  }

  const maybeRecord = event as Record<string, unknown>;
  const eventType = typeof maybeRecord.type === 'string' ? maybeRecord.type : 'event';
  if (typeof maybeRecord.message === 'string') {
    return `Codex ${eventType}: ${maybeRecord.message}`;
  }
  return `Codex ${eventType}: ${JSON.stringify(event).slice(0, 220)}`;
}

export function CreatePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [promptInput, setPromptInput] = useState('');

  const [game, setGame] = useState<GameRecord | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(Date.now());

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const slug = searchParams.get('slug');
    if (!slug) {
      setGame(null);
      setMessages([]);
      return;
    }
    const currentSlug = slug;

    let active = true;

    async function load() {
      try {
        const loaded = await getGame(currentSlug);
        if (active) {
          setGame(loaded);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load game');
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const previewSrc = useMemo(() => {
    if (!game) {
      return '';
    }
    return `${game.previewUrl}?t=${previewNonce}`;
  }, [game, previewNonce]);

  function appendMessage(role: ChatMessage['role'], content: string) {
    setMessages((previous) => [...previous, { id: nextId(), role, content }]);
  }

  async function refreshGame(slug: string) {
    const refreshed = await getGame(slug);
    setGame(refreshed);
    setPreviewNonce(Date.now());
  }

  function startRunStream(runId: string) {
    eventSourceRef.current?.close();

    const source = new EventSource(`/api/runs/${runId}/events`);
    eventSourceRef.current = source;

    source.onmessage = async (message) => {
      const event = JSON.parse(message.data) as RunEvent;

      if (event.type === 'queue_position') {
        return;
      }

      if (event.type === 'assistant_response') {
        const text = event.payload.text;
        if (typeof text === 'string' && text.trim().length > 0) {
          appendMessage('assistant', text);
        }
        return;
      }

      if (event.type === 'run_finished') {
        setIsGenerating(false);

        const maybeLast = event.payload.lastMessage;
        const maybeError = event.payload.error;
        if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
          appendMessage('system', `Generation failed: ${maybeError}`);
        } else if (typeof maybeLast === 'string' && maybeLast.trim().length > 0) {
          appendMessage('assistant', maybeLast);
        }

        if (game) {
          await refreshGame(game.slug);
        }

        source.close();
        eventSourceRef.current = null;
      }
    };

    source.onerror = () => {
      source.close();
      eventSourceRef.current = null;
      setIsGenerating(false);
    };
  }

  async function onSendPrompt(event: FormEvent) {
    event.preventDefault();

    const cleanPrompt = promptInput.trim();
    if (!cleanPrompt || isGenerating) {
      return;
    }

    setPromptInput('');
    setError(null);
    setIsGenerating(true);
    appendMessage('user', cleanPrompt);

    const chatContext: ChatMessage[] = [
      ...messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      { role: 'user', content: cleanPrompt }
    ];

    try {
      let activeGame = game;
      if (!activeGame) {
        activeGame = await createGame('');
        setGame(activeGame);
        setSearchParams({ slug: activeGame.slug });
      }

      const response = await generateGame(activeGame.slug, cleanPrompt, chatContext);
      setActiveRunId(response.runId);
      startRunStream(response.runId);
    } catch (requestError) {
      setIsGenerating(false);
      setError(requestError instanceof Error ? requestError.message : 'Failed to start generation');
    }
  }

  async function onCancelRun() {
    if (!activeRunId) {
      return;
    }

    try {
      await cancelRun(activeRunId);
      appendMessage('system', 'Cancellation requested.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to cancel run');
    }
  }

  return (
    <div className="create-screen">
      <div className="create-layout">
        <section className="chat-pane">
          <div className="chat-pane-header">
            <Link className="text-link" to="/">Back</Link>
            {game ? (
              <button className="text-link as-button" onClick={() => navigate(`/play/${game.slug}`)} type="button">
                Play
              </button>
            ) : null}
          </div>

          <div className="chat-log" role="log">
            {messages.length === 0 && (
              <p className="chat-empty">Describe the game you want to build.</p>
            )}
            {messages.map((message) => (
              <div className={`chat-row ${message.role === 'user' ? 'chat-row-right' : 'chat-row-left'}`} key={message.id}>
                <div className={`chat-bubble ${message.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="chat-row chat-row-left">
                <div className="chat-bubble bubble-assistant bubble-typing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <form className="prompt-input-wrap" onSubmit={onSendPrompt}>
            <textarea
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (promptInput.trim() && !isGenerating) {
                    onSendPrompt(e);
                  }
                }
              }}
              placeholder={isGenerating ? 'Generating...' : 'Describe the game or changes you want'}
              rows={1}
              value={promptInput}
              disabled={isGenerating}
            />
            {isGenerating ? (
              <button className="prompt-send-btn" onClick={onCancelRun} type="button" aria-label="Cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              </button>
            ) : (
              <button className="prompt-send-btn" disabled={!promptInput.trim()} type="submit" aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>
              </button>
            )}
          </form>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="preview-pane">
          {previewSrc ? (
            <iframe className="preview-frame" src={previewSrc} title={game?.title ?? 'preview'} />
          ) : (
            <div className="preview-empty">
              <p>Your game will appear here</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

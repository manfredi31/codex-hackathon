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

  const [titleInput, setTitleInput] = useState('');
  const [promptInput, setPromptInput] = useState('');

  const [game, setGame] = useState<GameRecord | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([]);

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

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
        const maybePosition = event.payload.position;
        if (typeof maybePosition === 'number') {
          setQueuePosition(maybePosition);
        }
        return;
      }

      if (event.type === 'status') {
        const status = event.payload.status;
        appendMessage('system', `Run status: ${String(status)}`);
        return;
      }

      if (event.type === 'codex_event') {
        appendMessage('system', toHumanCodexEvent(event.payload.event));
        return;
      }

      if (event.type === 'stderr') {
        appendMessage('system', `stderr: ${String(event.payload.text)}`);
        return;
      }

      if (event.type === 'run_finished') {
        setIsGenerating(false);
        setQueuePosition(null);

        const maybeLast = event.payload.lastMessage;
        if (typeof maybeLast === 'string' && maybeLast.trim().length > 0) {
          appendMessage('assistant', maybeLast);
        } else {
          appendMessage('system', `Run finished: ${String(event.payload.status)}`);
        }

        if (game) {
          await refreshGame(game.slug);
        }

        source.close();
        eventSourceRef.current = null;
      }
    };

    source.onerror = () => {
      appendMessage('system', 'SSE connection interrupted.');
      source.close();
      eventSourceRef.current = null;
      setIsGenerating(false);
      setQueuePosition(null);
    };
  }

  async function onCreateGame(event: FormEvent) {
    event.preventDefault();
    if (!titleInput.trim() || isCreatingGame) {
      return;
    }

    setIsCreatingGame(true);
    setError(null);

    try {
      const created = await createGame(titleInput.trim());
      setGame(created);
      setSearchParams({ slug: created.slug });
      setTitleInput('');
      appendMessage('system', `Game ready: ${created.title}. Send the first prompt to generate it.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create game');
    } finally {
      setIsCreatingGame(false);
    }
  }

  async function onSendPrompt(event: FormEvent) {
    event.preventDefault();

    const cleanPrompt = promptInput.trim();
    if (!game || !cleanPrompt || isGenerating) {
      return;
    }

    setPromptInput('');
    setError(null);
    setIsGenerating(true);
    appendMessage('user', cleanPrompt);

    const chatContext: ChatMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

    try {
      const response = await generateGame(game.slug, cleanPrompt, chatContext);
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
    <div className="screen create-screen">
      <div className="create-header">
        <Link className="text-link" to="/">
          Back to games
        </Link>
        <h2>Create / Iterate</h2>
        {game ? (
          <button className="text-link as-button" onClick={() => navigate(`/play/${game.slug}`)} type="button">
            Play this game
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="create-layout">
        <section className="chat-pane">
          <h3>Chat</h3>

          {!game ? (
            <form className="title-form" onSubmit={onCreateGame}>
              <label htmlFor="title-input">Game title</label>
              <input
                id="title-input"
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Neon Dodge"
                value={titleInput}
              />
              <button className="primary" disabled={isCreatingGame || !titleInput.trim()} type="submit">
                {isCreatingGame ? 'Creating...' : 'Create game folder'}
              </button>
            </form>
          ) : (
            <>
              <p className="game-context">
                Working on <strong>{game.title}</strong> (<code>{game.slug}</code>)
              </p>

              <div className="chat-log" role="log">
                {messages.map((message) => (
                  <article className={`chat-bubble ${message.role}`} key={message.id}>
                    <div className="bubble-role">{message.role}</div>
                    <div className="bubble-content">{message.content}</div>
                  </article>
                ))}
              </div>

              <form className="prompt-form" onSubmit={onSendPrompt}>
                <textarea
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Describe the game or changes you want"
                  rows={5}
                  value={promptInput}
                />
                <div className="prompt-actions">
                  <button className="primary" disabled={isGenerating || !promptInput.trim()} type="submit">
                    {isGenerating ? 'Generating...' : 'Send prompt'}
                  </button>
                  {isGenerating ? (
                    <button className="secondary" onClick={onCancelRun} type="button">
                      Cancel run
                    </button>
                  ) : null}
                </div>
              </form>

              {queuePosition ? <p className="queue-text">Queue position: {queuePosition}</p> : null}
            </>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="preview-pane">
          <h3>Game preview</h3>
          {previewSrc ? <iframe className="preview-frame" src={previewSrc} title={game?.title ?? 'preview'} /> : <p>Create a game to start previewing it.</p>}
        </section>
      </div>
    </div>
  );
}

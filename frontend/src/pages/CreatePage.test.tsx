import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreatePage } from './CreatePage';

class FakeEventSource {
  url: string;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent<string>) => unknown) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  close() {
    return;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CreatePage', () => {
  it('creates game from first prompt without asking title', async () => {
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource);

    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input);

      if (url === '/api/games') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              slug: 'neon',
              title: 'Neon',
              createdAt: '2026-02-05T12:00:00+00:00',
              updatedAt: '2026-02-05T12:01:00+00:00',
              previewUrl: '/games/neon/index.html',
              imageUrl: '/games/neon/card.png'
            }),
            { status: 200 }
          )
        );
      }

      if (url === '/api/games/neon/generate') {
        return Promise.resolve(new Response(JSON.stringify({ runId: 'run-1' }), { status: 200 }));
      }

      if (url === '/api/games/neon') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              slug: 'neon',
              title: 'Neon',
              createdAt: '2026-02-05T12:00:00+00:00',
              updatedAt: '2026-02-05T12:01:00+00:00',
              previewUrl: '/games/neon/index.html',
              imageUrl: '/games/neon/card.png'
            }),
            { status: 200 }
          )
        );
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/describe the game/i), {
      target: { value: 'Generate a snake game' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create \+ generate/i }));

    expect(await screen.findByText(/game folder ready/i)).toBeInTheDocument();
    expect(await screen.findByText(/generate a snake game/i)).toBeInTheDocument();
  });
});

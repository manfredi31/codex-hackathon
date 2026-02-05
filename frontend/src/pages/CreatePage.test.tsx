import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CreatePage } from './CreatePage';

class FakeEventSource {
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent<string>) => unknown) | null = null;

  close() {
    return;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CreatePage', () => {
  it('creates a game and shows context', async () => {
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource);

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            slug: 'neon',
            title: 'Neon',
            createdAt: '2026-02-05T12:00:00+00:00',
            updatedAt: '2026-02-05T12:01:00+00:00',
            previewUrl: '/games/neon/index.html'
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            slug: 'neon',
            title: 'Neon',
            createdAt: '2026-02-05T12:00:00+00:00',
            updatedAt: '2026-02-05T12:01:00+00:00',
            previewUrl: '/games/neon/index.html'
          }),
          { status: 200 }
        )
      );

    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/game title/i), { target: { value: 'Neon' } });
    fireEvent.click(screen.getByRole('button', { name: /create game folder/i }));

    expect(await screen.findByText(/working on/i)).toBeInTheDocument();
    expect(screen.getByText(/working on/i)).toHaveTextContent('Neon');
  });
});

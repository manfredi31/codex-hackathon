import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayPage } from './PlayPage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlayPage', () => {
  it('loads game and renders iframe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: 'runner',
          title: 'Runner',
          createdAt: '2026-02-05T12:00:00+00:00',
          updatedAt: '2026-02-05T12:01:00+00:00',
          previewUrl: '/games/runner/index.html'
        }),
        { status: 200 }
      )
    );

    render(
      <MemoryRouter initialEntries={['/play/runner']}>
        <Routes>
          <Route path="/play/:slug" element={<PlayPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTitle('Runner')).toBeInTheDocument();
  });
});

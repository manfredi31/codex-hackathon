import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('renders list of games from API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            slug: 'neon-dodge',
            title: 'Neon Dodge',
            createdAt: '2026-02-05T12:00:00+00:00',
            updatedAt: '2026-02-05T12:01:00+00:00',
            previewUrl: '/games/neon-dodge/index.html'
          }
        ]),
        { status: 200 }
      )
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Neon Dodge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });
});

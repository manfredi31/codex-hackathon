import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GameCard } from '../components/GameCard';
import { listGames } from '../lib/api';
import type { GameRecord } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listGames();
        if (active) {
          setGames(result);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load games');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter((g) => g.title.toLowerCase().includes(q));
  }, [games, search]);

  return (
    <div className="home-screen">
      <nav className="top-bar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-create" onClick={() => navigate('/create')} type="button">
          Create
        </button>
      </nav>

      <main className="home-content">
        {loading ? <p className="loading-text">Loading games...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && filtered.length > 0 && (
          <div className="game-grid" role="list">
            {filtered.map((game) => (
              <GameCard key={game.slug} game={game} onClick={(slug) => navigate(`/play/${slug}`)} />
            ))}
          </div>
        )}

        {!loading && games.length > 0 && filtered.length === 0 ? (
          <div className="empty-state">
            <p>No games match your search.</p>
          </div>
        ) : null}

        {!loading && games.length === 0 ? (
          <div className="empty-state">
            <p>No games yet. Click <strong>Create</strong> to make your first game.</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

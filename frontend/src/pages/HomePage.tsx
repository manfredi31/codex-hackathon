import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GameCard } from '../components/GameCard';
import { listGames } from '../lib/api';
import type { GameRecord } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <h1>AI Game Studio</h1>
        <button className="primary" onClick={() => navigate('/create')} type="button">
          Create
        </button>
      </div>

      {loading ? <p>Loading games...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="game-grid" role="list">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} onClick={(slug) => navigate(`/play/${slug}`)} />
        ))}
      </div>

      {!loading && games.length === 0 ? (
        <p className="empty-state">No games yet. Click Create to make your first game.</p>
      ) : null}
    </div>
  );
}

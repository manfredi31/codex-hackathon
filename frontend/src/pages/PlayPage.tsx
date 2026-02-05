import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getGame } from '../lib/api';
import type { GameRecord } from '../types';

export function PlayPage() {
  const { slug = '' } = useParams();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getGame(slug);
        if (active) {
          setGame(result);
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
  }, [slug]);

  const previewSrc = useMemo(() => {
    if (!game) {
      return '';
    }
    return `${game.previewUrl}?t=${Date.now()}`;
  }, [game]);

  return (
    <div className="screen play-screen">
      <div className="play-header">
        <Link className="text-link" to="/">
          Back to games
        </Link>
        <h2>{game?.title ?? 'Play'}</h2>
        <Link className="text-link" to={`/create?slug=${slug}`}>
          Iterate in Create
        </Link>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="play-frame-wrap">
        {previewSrc ? <iframe className="play-frame" src={previewSrc} title={game?.title ?? slug} /> : <p>Loading...</p>}
      </div>
    </div>
  );
}

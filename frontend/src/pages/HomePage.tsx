import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GameCard } from '../components/GameCard';
import { listGames } from '../lib/api';
import type { GameRecord } from '../types';

const BG_CLIPS = [
  '/videos/clip-1.mp4',
  '/videos/clip-2.mp4',
  '/videos/clip-3.mp4',
  '/videos/clip-4.mp4',
  '/videos/clip-5.mp4',
];

const CLIP_DURATION = 5_000;
const FADE_DURATION = 800;

/** Fixed full-viewport background that cycles through gameplay videos. */
function BackgroundVideo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const [useA, setUseA] = useState(true);

  const advance = useCallback(() => {
    setFadingOut(true);

    const nextIndex = (activeIndex + 1) % BG_CLIPS.length;
    const nextRef = useA ? videoRefB : videoRefA;
    if (nextRef.current) {
      nextRef.current.src = BG_CLIPS[nextIndex];
      nextRef.current.load();
      nextRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setActiveIndex(nextIndex);
      setUseA((prev) => !prev);
      setFadingOut(false);
    }, FADE_DURATION);
  }, [activeIndex, useA]);

  useEffect(() => {
    const timer = setInterval(advance, CLIP_DURATION);
    return () => clearInterval(timer);
  }, [advance]);

  useEffect(() => {
    if (videoRefA.current) {
      videoRefA.current.src = BG_CLIPS[0];
      videoRefA.current.load();
      videoRefA.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="bg-video-wrap" aria-hidden="true">
      <video
        ref={videoRefA}
        className={`bg-video ${useA ? 'bg-video-active' : ''} ${fadingOut && useA ? 'bg-video-fading' : ''}`}
        muted
        playsInline
        loop
      />
      <video
        ref={videoRefB}
        className={`bg-video ${!useA ? 'bg-video-active' : ''} ${fadingOut && !useA ? 'bg-video-fading' : ''}`}
        muted
        playsInline
        loop
      />
      <div className="bg-video-overlay" />
    </div>
  );
}

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
      {/* Full-screen background video */}
      <BackgroundVideo />

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

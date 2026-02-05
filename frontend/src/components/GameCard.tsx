import type { GameRecord } from '../types';

interface GameCardProps {
  game: GameRecord;
  onClick: (slug: string) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  return (
    <button className="game-card" onClick={() => onClick(game.slug)} type="button">
      <div className="game-card-img-wrap">
        {game.imageUrl ? (
          <img alt={`${game.title} card`} className="game-card-image" src={game.imageUrl} />
        ) : (
          <div className="game-card-image placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
            </svg>
          </div>
        )}
      </div>
      <div className="game-card-info">
        <span className="game-card-title">{game.title}</span>
      </div>
    </button>
  );
}

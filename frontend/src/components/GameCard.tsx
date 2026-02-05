import type { GameRecord } from '../types';

interface GameCardProps {
  game: GameRecord;
  onClick: (slug: string) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  return (
    <button className="game-card" onClick={() => onClick(game.slug)} type="button">
      <div className="game-card-title">{game.title}</div>
      <div className="game-card-meta">/{game.slug}</div>
      <div className="game-card-meta">Updated {new Date(game.updatedAt).toLocaleString()}</div>
    </button>
  );
}

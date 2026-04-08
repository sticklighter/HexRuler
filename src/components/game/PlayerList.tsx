// Player List - Shows all players and their status
import type { GameState, Player } from '@/types/game';
import { getPlayerCountries, getPlayerTotalResources } from '@/utils/gameUtils';

interface PlayerListProps {
  gameState: GameState;
  currentPlayerId: string | null;
}

export function PlayerList({ gameState, currentPlayerId }: PlayerListProps) {
  const players = Object.values(gameState.players).filter((p) => !p.isNeutral);

  return (
    <div data-ev-id="ev_e69639a296" className="absolute top-24 right-4 z-20 w-56 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div data-ev-id="ev_a5aecddc48" className="p-3 border-b border-slate-700">
        <h3 data-ev-id="ev_30313dfb50" className="text-white font-semibold text-sm">Players</h3>
      </div>
      
      <div data-ev-id="ev_799bdfead6" className="flex flex-col gap-1 p-2">
        {players.map((player) => {
          const countries = getPlayerCountries(player.id, gameState.countries);
          const resources = getPlayerTotalResources(player.id, gameState.countries);
          const isCurrent = player.id === currentPlayerId;

          return (
            <div data-ev-id="ev_52f4f3ad1a"
            key={player.id}
            className={`rounded-lg p-2 transition-colors ${
            player.isEliminated ?
            'bg-slate-700/30 opacity-50' :
            isCurrent ?
            'bg-amber-500/20 border border-amber-500/50' :
            'bg-slate-700/50 hover:bg-slate-700'}`
            }>

              <div data-ev-id="ev_8137d6996d" className="flex items-center gap-2">
                <div data-ev-id="ev_415bd10775"
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: player.color }} />

                <span data-ev-id="ev_8bf16f7cc7" className={`text-sm font-medium ${
                player.isEliminated ? 'text-slate-500 line-through' : 'text-white'}`
                }>
                  {player.name}
                </span>
                {player.isAI &&
                <span data-ev-id="ev_fc335e9a80" className="text-xs bg-slate-600 text-slate-400 px-1.5 py-0.5 rounded ml-auto">
                    AI
                  </span>
                }
              </div>
              
              {!player.isEliminated &&
              <div data-ev-id="ev_87a99ceef0" className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span data-ev-id="ev_4646492f98">🌐 {countries.length}</span>
                  <span data-ev-id="ev_a5d29ae988">⚔️ {formatNumber(resources.army)}</span>
                  <span data-ev-id="ev_1c306c16b1">💰 {formatNumber(resources.money)}</span>
                </div>
              }
              
              {player.isEliminated &&
              <div data-ev-id="ev_90a82fe6ef" className="text-xs text-red-400 mt-1">Eliminated</div>
              }
            </div>);

        })}
      </div>
    </div>);

}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

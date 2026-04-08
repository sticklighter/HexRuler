// Game HUD - Shows current player, resources, round info
import type { GameState, Player, Resources } from '@/types/game';
import { getPlayerTotalResources, getPlayerCountries } from '@/utils/gameUtils';

interface GameHUDProps {
  gameState: GameState;
  currentPlayer: Player;
  pendingActionsCount: number;
  onEndTurn: () => void;
  onClearActions: () => void;
}

export function GameHUD({
  gameState,
  currentPlayer,
  pendingActionsCount,
  onEndTurn,
  onClearActions
}: GameHUDProps) {
  const resources = getPlayerTotalResources(currentPlayer.id, gameState.countries);
  const countryCount = getPlayerCountries(currentPlayer.id, gameState.countries).length;

  // Get turn order display
  const activePlayers = gameState.turnOrder.filter(
    (id) => !gameState.players[id].isEliminated && !gameState.players[id].isNeutral
  );

  return (
    <div data-ev-id="ev_f4d4d624bf" className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900 via-slate-900/95 to-transparent pb-8">
      <div data-ev-id="ev_0f3f4183d7" className="flex items-start justify-between p-4">
        {/* Left: Current Player & Turn Info */}
        <div data-ev-id="ev_ae8ce4bf5b" className="flex flex-col gap-2">
          <div data-ev-id="ev_db92352deb" className="flex items-center gap-3">
            <div data-ev-id="ev_3bab586b5c"
            className="w-8 h-8 rounded-lg shadow-lg"
            style={{ backgroundColor: currentPlayer.color }} />

            <div data-ev-id="ev_5706167355">
              <h2 data-ev-id="ev_07bbe82578" className="text-white font-bold text-lg">
                {currentPlayer.name}'s Turn
                {currentPlayer.isAI && <span data-ev-id="ev_7869f09b4a" className="ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded">AI</span>}
              </h2>
              <p data-ev-id="ev_be1192d079" className="text-slate-400 text-sm">
                Round {gameState.round} • {countryCount} {countryCount === 1 ? 'Country' : 'Countries'}
              </p>
            </div>
          </div>
          
          {/* Turn Order */}
          <div data-ev-id="ev_68a1d39278" className="flex items-center gap-1 mt-1">
            <span data-ev-id="ev_9f4bb063f4" className="text-slate-500 text-xs mr-2">Turn Order:</span>
            {activePlayers.map((id, i) => {
              const p = gameState.players[id];
              const isCurrent = id === currentPlayer.id;
              return (
                <div data-ev-id="ev_f12860c7d4"
                key={id}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : 'opacity-60'}`
                }
                style={{ backgroundColor: p.color }}
                title={p.name}>

                  {i + 1}
                </div>);

            })}
            <span data-ev-id="ev_18e90500c4" className="text-slate-600 text-xs ml-1">
              {gameState.turnDirection === 1 ? '→' : '←'}
            </span>
          </div>
        </div>
        
        {/* Center: Resources */}
        <div data-ev-id="ev_4ecd0632af" className="flex items-center gap-6 bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-700">
          <ResourceDisplay icon="💰" label="Money" value={resources.money} color="text-yellow-400" />
          <ResourceDisplay icon="🎓" label="Education" value={resources.education} color="text-blue-400" />
          <ResourceDisplay icon="🔬" label="Technology" value={resources.technology} color="text-purple-400" />
          <ResourceDisplay icon="⚔️" label="Army" value={resources.army} color="text-red-400" />
        </div>
        
        {/* Right: Actions */}
        <div data-ev-id="ev_badbd84545" className="flex items-center gap-3">
          {pendingActionsCount > 0 &&
          <button data-ev-id="ev_fe675b2db0"
          onClick={onClearActions}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">

              Clear ({pendingActionsCount})
            </button>
          }
          <button data-ev-id="ev_49998aa787"
          onClick={onEndTurn}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg">

            End Turn
          </button>
        </div>
      </div>
    </div>);

}

function ResourceDisplay({ icon, label, value, color }: {icon: string;label: string;value: number;color: string;}) {
  return (
    <div data-ev-id="ev_04f2d14d16" className="flex flex-col items-center">
      <span data-ev-id="ev_bd3d299b0d" className="text-lg">{icon}</span>
      <span data-ev-id="ev_af60005726" className={`font-bold ${color}`}>{formatNumber(value)}</span>
      <span data-ev-id="ev_db2008b322" className="text-slate-500 text-xs">{label}</span>
    </div>);

}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

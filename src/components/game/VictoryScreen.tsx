// Victory Screen - Shows when a player wins
import type { GameState, Player } from '@/types/game';

interface VictoryScreenProps {
  winner: Player;
  gameState: GameState;
  onNewGame: () => void;
}

export function VictoryScreen({ winner, gameState, onNewGame }: VictoryScreenProps) {
  return (
    <div data-ev-id="ev_643b0f0058" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div data-ev-id="ev_4d12a8e305" className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-slate-700 shadow-2xl">
        {/* Crown icon */}
        <div data-ev-id="ev_824fa8dd93" className="text-6xl mb-4">👑</div>
        
        {/* Winner name */}
        <h1 data-ev-id="ev_07992a8967" className="text-4xl font-bold text-white mb-2">
          <span data-ev-id="ev_bf51fd6979" style={{ color: winner.color }}>{winner.name}</span>
        </h1>
        <h2 data-ev-id="ev_87b0e3fdb9" className="text-2xl text-amber-400 mb-6">Wins!</h2>
        
        {/* Stats */}
        <div data-ev-id="ev_8e4711dbf5" className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <h3 data-ev-id="ev_fbfc9b77d3" className="text-slate-400 text-sm font-semibold mb-3">Final Statistics</h3>
          <div data-ev-id="ev_ccc25ce5a8" className="grid grid-cols-2 gap-3 text-sm">
            <div data-ev-id="ev_29ca1cbcf9" className="bg-slate-600/50 rounded-lg p-2">
              <div data-ev-id="ev_7f6b2a4023" className="text-slate-400">Rounds</div>
              <div data-ev-id="ev_c1d8f40bac" className="text-white font-bold text-lg">{gameState.round - 1}</div>
            </div>
            <div data-ev-id="ev_66c9ab420a" className="bg-slate-600/50 rounded-lg p-2">
              <div data-ev-id="ev_658ef813c4" className="text-slate-400">Countries</div>
              <div data-ev-id="ev_72433da2f0" className="text-white font-bold text-lg">
                {Object.values(gameState.countries).filter((c) => c.ownerId === winner.id).length}
              </div>
            </div>
            <div data-ev-id="ev_d48276ebde" className="bg-slate-600/50 rounded-lg p-2">
              <div data-ev-id="ev_cedf69b140" className="text-slate-400">Battles Won</div>
              <div data-ev-id="ev_e89a30d397" className="text-white font-bold text-lg">
                {gameState.combatLog.filter((log) => log.attackerId === winner.id && log.result === 'attacker_wins').length}
              </div>
            </div>
            <div data-ev-id="ev_aaaccfacf7" className="bg-slate-600/50 rounded-lg p-2">
              <div data-ev-id="ev_7ff1de2450" className="text-slate-400">Players Eliminated</div>
              <div data-ev-id="ev_f793633b0e" className="text-white font-bold text-lg">
                {Object.values(gameState.players).filter((p) => p.isEliminated && !p.isNeutral).length}
              </div>
            </div>
          </div>
        </div>
        
        {/* Eliminated players */}
        <div data-ev-id="ev_eaef3a9729" className="mb-6">
          <h3 data-ev-id="ev_34b6cc5ad7" className="text-slate-400 text-sm font-semibold mb-2">Eliminated</h3>
          <div data-ev-id="ev_dc94674956" className="flex flex-wrap justify-center gap-2">
            {Object.values(gameState.players).
            filter((p) => p.isEliminated && !p.isNeutral).
            map((p) =>
            <div data-ev-id="ev_98f9397eb9"
            key={p.id}
            className="px-3 py-1 rounded-full text-sm text-white/70 flex items-center gap-2"
            style={{ backgroundColor: p.color + '40' }}>

                  <div data-ev-id="ev_fc9a28a80b" className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </div>
            )}
          </div>
        </div>
        
        {/* New game button */}
        <button data-ev-id="ev_00bfe9cd90"
        onClick={onNewGame}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">

          Play Again
        </button>
      </div>
    </div>);

}

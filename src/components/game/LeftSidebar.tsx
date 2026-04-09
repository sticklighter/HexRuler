// Left Sidebar - Menu, Player Info, Player List, Actions
import { useState } from 'react';
import type { GameState, Player } from '@/types/game';
import { getPlayerTotalResources, getPlayerCountries } from '@/utils/gameUtils';

interface LeftSidebarProps {
  gameState: GameState;
  currentPlayer: Player;
  pendingActionsCount: number;
  onEndTurn: () => void;
  onClearActions: () => void;
  onRestart: () => void;
  onRequestAlliance: (targetPlayerId: string) => void;
  onAcceptAlliance: (fromPlayerId: string) => void;
  onRejectAlliance: (fromPlayerId: string) => void;
  onBreakAlliance: (allyId: string) => void;
}

export function LeftSidebar({
  gameState,
  currentPlayer,
  pendingActionsCount,
  onEndTurn,
  onClearActions,
  onRestart,
  onRequestAlliance,
  onAcceptAlliance,
  onRejectAlliance,
  onBreakAlliance
}: LeftSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [diplomacyOpen, setDiplomacyOpen] = useState(false);

  const resources = getPlayerTotalResources(currentPlayer.id, gameState.countries);
  const countryCount = getPlayerCountries(currentPlayer.id, gameState.countries).length;
  const players = Object.values(gameState.players).filter((p) => !p.isNeutral);
  const activePlayers = gameState.turnOrder.filter(
    (id) => !gameState.players[id].isEliminated && !gameState.players[id].isNeutral
  );

  // Get potential alliance targets (non-allied, non-self, non-eliminated players)
  const allianceTargets = players.filter((p) =>
  p.id !== currentPlayer.id &&
  !p.isEliminated &&
  !currentPlayer.allies.includes(p.id) &&
  !currentPlayer.outgoingAllianceRequests.includes(p.id)
  );

  // Check if alliances are allowed (more than 2 players)
  const alliancesAllowed = activePlayers.length > 2;

  return (
    <div data-ev-id="ev_dc6b66ea56" className="absolute top-0 left-0 bottom-0 z-20 w-64 flex flex-col pointer-events-none">
      {/* Menu Button */}
      <div data-ev-id="ev_47204f696a" className="p-4 pointer-events-auto">
        <button data-ev-id="ev_4cc62d710c"
        onClick={() => setMenuOpen(!menuOpen)}
        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all">

          Menu
        </button>
        
        {menuOpen &&
        <div data-ev-id="ev_cfbd31a160" className="mt-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
            <button data-ev-id="ev_059215b544"
          onClick={() => {onRestart();setMenuOpen(false);}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors border-b border-slate-700">

              🔄 Restart
            </button>
            <button data-ev-id="ev_b50ad2d509"
          onClick={() => {window.location.reload();}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors">

              🚪 Exit to Setup
            </button>
          </div>
        }
      </div>
      
      {/* Player Info */}
      <div data-ev-id="ev_31abaf8954" className="px-4 pb-2 pointer-events-auto">
        <div data-ev-id="ev_499c695cf4" className="flex items-center gap-3">
          <div data-ev-id="ev_639174650d"
          className="w-10 h-10 rounded-lg shadow-lg flex-shrink-0"
          style={{ backgroundColor: currentPlayer.color }} />

          <div data-ev-id="ev_f437f0f937">
            <h2 data-ev-id="ev_79d49976ce" className="text-white font-bold text-lg">
              {currentPlayer.name}'s Turn
              {currentPlayer.isAI && <span data-ev-id="ev_17b966dd50" className="ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded">AI</span>}
            </h2>
            <p data-ev-id="ev_26e48fe3e3" className="text-slate-400 text-sm">
              Round {gameState.round} • {countryCount} {countryCount === 1 ? 'Country' : 'Countries'}
            </p>
          </div>
        </div>
        
        {/* Turn Order */}
        <div data-ev-id="ev_8338efd1f7" className="flex items-center gap-1 mt-2">
          <span data-ev-id="ev_a7fc2e4bc5" className="text-slate-500 text-xs mr-2">Turn Order:</span>
          {activePlayers.map((id, i) => {
            const p = gameState.players[id];
            const isCurrent = id === currentPlayer.id;
            return (
              <div data-ev-id="ev_bf41dcb0a3"
              key={id}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : 'opacity-60'}`
              }
              style={{ backgroundColor: p.color }}
              title={p.name}>

                {i + 1}
              </div>);

          })}
          <span data-ev-id="ev_06421829eb" className="text-slate-600 text-xs ml-1">
            {gameState.turnDirection === 1 ? '→' : '←'}
          </span>
        </div>
      </div>
      
      {/* Players List */}
      <div data-ev-id="ev_0a9c5e48c0" className="mx-4 mb-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden pointer-events-auto flex-1 flex flex-col min-h-0">
        <div data-ev-id="ev_74c26565dd" className="p-3 border-b border-slate-700 flex items-center justify-between">
          <h3 data-ev-id="ev_fcdbf324cd" className="text-white font-semibold text-sm">Players</h3>
          {alliancesAllowed && !currentPlayer.isAI &&
          <button data-ev-id="ev_2ff3368774"
          onClick={() => setDiplomacyOpen(!diplomacyOpen)}
          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors">

              🤝 Diplomacy
            </button>
          }
        </div>
        
        {/* Alliance Requests */}
        {currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI &&
        <div data-ev-id="ev_480e621563" className="p-2 bg-green-500/10 border-b border-slate-700">
            <div data-ev-id="ev_5cfd9ef997" className="text-xs text-green-400 font-semibold mb-1">Alliance Requests:</div>
            {currentPlayer.pendingAllianceRequests.map((fromId) => {
            const fromPlayer = gameState.players[fromId];
            return (
              <div data-ev-id="ev_b29f029a9c" key={fromId} className="flex items-center justify-between gap-2 py-1">
                  <span data-ev-id="ev_beb213d1b9" className="text-white text-xs">{fromPlayer?.name}</span>
                  <div data-ev-id="ev_9f74e6b7ef" className="flex gap-1">
                    <button data-ev-id="ev_5275e14c4b"
                  onClick={() => onAcceptAlliance(fromId)}
                  className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-400">

                      ✓
                    </button>
                    <button data-ev-id="ev_6067b64db1"
                  onClick={() => onRejectAlliance(fromId)}
                  className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-400">

                      ✗
                    </button>
                  </div>
                </div>);

          })}
          </div>
        }
        
        <div data-ev-id="ev_b44f0f8f3e" className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
          {players.map((player) => {
            const countries = getPlayerCountries(player.id, gameState.countries);
            const playerResources = getPlayerTotalResources(player.id, gameState.countries);
            const isCurrent = player.id === currentPlayer.id;
            const isAlly = currentPlayer.allies.includes(player.id);
            const hasPendingRequest = currentPlayer.outgoingAllianceRequests.includes(player.id);

            return (
              <div data-ev-id="ev_07d89791a6"
              key={player.id}
              className={`rounded-lg p-2 transition-colors ${
              player.isEliminated ? 'bg-slate-700/30 opacity-50' :
              isCurrent ? 'bg-amber-500/20 border border-amber-500/50' :
              isAlly ? 'bg-green-500/20 border border-green-500/50' :
              'bg-slate-700/50 hover:bg-slate-700'}`
              }>

                <div data-ev-id="ev_995e6b3f03" className="flex items-center gap-2">
                  <div data-ev-id="ev_ab43338675"
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }} />

                  <span data-ev-id="ev_14ccab0030" className={`text-sm font-medium flex-1 ${
                  player.isEliminated ? 'text-slate-500 line-through' : 'text-white'}`
                  }>
                    {player.name}
                    {isAlly && <span data-ev-id="ev_1c559cb812" className="ml-1 text-green-400 text-xs">(🤝 Ally)</span>}
                  </span>
                  {player.isAI &&
                  <span data-ev-id="ev_a18a224167" className="text-xs bg-slate-600 text-slate-400 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  }
                </div>
                
                {!player.isEliminated &&
                <div data-ev-id="ev_724525479e" className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span data-ev-id="ev_c154391370">🌐 {countries.length}</span>
                    <span data-ev-id="ev_3c50c466d2">⚔️ {formatNumber(playerResources.army)}</span>
                    <span data-ev-id="ev_c45701ceec">💰 {formatNumber(playerResources.money)}</span>
                  </div>
                }
                
                {player.isEliminated &&
                <div data-ev-id="ev_ae25e3570e" className="text-xs text-red-400 mt-1">Eliminated</div>
                }
                
                {/* Diplomacy actions */}
                {diplomacyOpen && !player.isEliminated && !isCurrent && !currentPlayer.isAI && alliancesAllowed &&
                <div data-ev-id="ev_39204d40dc" className="mt-2 pt-2 border-t border-slate-600">
                    {isAlly ?
                  <button data-ev-id="ev_3cd26a016a"
                  onClick={() => onBreakAlliance(player.id)}
                  className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 w-full">

                        Break Alliance
                      </button> :
                  hasPendingRequest ?
                  <span data-ev-id="ev_2e7f0c12d2" className="text-xs text-yellow-400">Request Pending...</span> :

                  <button data-ev-id="ev_c99a7094ca"
                  onClick={() => onRequestAlliance(player.id)}
                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 w-full">

                        Request Alliance
                      </button>
                  }
                  </div>
                }
              </div>);

          })}
        </div>
      </div>
      
      {/* Resources Display */}
      <div data-ev-id="ev_ed08cf2002" className="mx-4 mb-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-3 pointer-events-auto">
        <div data-ev-id="ev_3dbc1ba050" className="grid grid-cols-4 gap-2 text-center">
          <div data-ev-id="ev_26761577b7">
            <div data-ev-id="ev_a82ce2474c" className="text-lg">💰</div>
            <div data-ev-id="ev_23fff63560" className="text-yellow-400 font-bold text-sm">{formatNumber(resources.money)}</div>
          </div>
          <div data-ev-id="ev_773e632d67">
            <div data-ev-id="ev_cb14b4fa35" className="text-lg">🎓</div>
            <div data-ev-id="ev_e016e795a4" className="text-blue-400 font-bold text-sm">{formatNumber(resources.education)}</div>
          </div>
          <div data-ev-id="ev_ffd9639904">
            <div data-ev-id="ev_928673b50c" className="text-lg">🔬</div>
            <div data-ev-id="ev_dde6245a21" className="text-purple-400 font-bold text-sm">{formatNumber(resources.technology)}</div>
          </div>
          <div data-ev-id="ev_83c568c9b5">
            <div data-ev-id="ev_f6ff8454d0" className="text-lg">⚔️</div>
            <div data-ev-id="ev_94ae373525" className="text-red-400 font-bold text-sm">{formatNumber(resources.army)}</div>
          </div>
        </div>
      </div>
      
      {/* End Turn Button */}
      <div data-ev-id="ev_2cc2f62f99" className="px-4 pb-4 pointer-events-auto">
        {pendingActionsCount > 0 &&
        <button data-ev-id="ev_236b6bb370"
        onClick={onClearActions}
        className="w-full mb-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">

            Clear Actions ({pendingActionsCount})
          </button>
        }
        <button data-ev-id="ev_d86d1ca6de"
        onClick={onEndTurn}
        className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">

          End Turn
        </button>
      </div>
    </div>);

}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

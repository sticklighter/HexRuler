// Left Sidebar - Menu, Player Info, Player List, Actions
import { useState } from 'react';
import type { GameState, Player, GameConfig } from '@/types/game';
import { getPlayerTotalResources, getPlayerCountries } from '@/utils/gameUtils';

interface LeftSidebarProps {
  gameState: GameState;
  currentPlayer: Player;
  pendingActionsCount: number;
  onEndTurn: () => void;
  onClearActions: () => void;
  onRestart: () => void;
  onExit: () => void;
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
  onExit,
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

  // Check if alliances are allowed (more than 2 players)
  const alliancesAllowed = activePlayers.length > 2;

  return (
    <div data-ev-id="ev_d9285173fb" className="absolute top-0 left-0 bottom-0 z-20 w-64 flex flex-col pointer-events-none">
      {/* Menu Button */}
      <div data-ev-id="ev_b28d6ba0bb" className="p-4 pointer-events-auto">
        <button data-ev-id="ev_24311b6cc8"
        onClick={() => setMenuOpen(!menuOpen)}
        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all">

          Menu
        </button>
        
        {menuOpen &&
        <div data-ev-id="ev_45f3436aaf" className="mt-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
            <button data-ev-id="ev_1e7369e930"
          onClick={() => {onRestart();setMenuOpen(false);}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors border-b border-slate-700">

              🔄 Restart Game
            </button>
            <button data-ev-id="ev_059215b544"
          onClick={() => {onExit();setMenuOpen(false);}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors">

              🚪 Exit to Setup
            </button>
          </div>
        }
      </div>
      
      {/* Player Info */}
      <div data-ev-id="ev_27aa90a23a" className="px-4 pb-2 pointer-events-auto">
        <div data-ev-id="ev_46500c3285" className="flex items-center gap-3">
          <div data-ev-id="ev_27b97c4aa7"
          className="w-10 h-10 rounded-lg shadow-lg flex-shrink-0"
          style={{ backgroundColor: currentPlayer.color }} />

          <div data-ev-id="ev_6e7bd7e88a">
            <h2 data-ev-id="ev_f9362255b7" className="text-white font-bold text-lg">
              {currentPlayer.name}'s Turn
              {currentPlayer.isAI && <span data-ev-id="ev_92d5379868" className="ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded">AI</span>}
            </h2>
            <p data-ev-id="ev_9a2c386dee" className="text-slate-400 text-sm">
              Round {gameState.round} • {countryCount} {countryCount === 1 ? 'Country' : 'Countries'}
            </p>
          </div>
        </div>
        
        {/* Turn Order */}
        <div data-ev-id="ev_b4b75ec1d9" className="flex items-center gap-1 mt-2">
          <span data-ev-id="ev_f8fd28d3d3" className="text-slate-500 text-xs mr-2">Turn Order:</span>
          {activePlayers.map((id, i) => {
            const p = gameState.players[id];
            const isCurrent = id === currentPlayer.id;
            return (
              <div data-ev-id="ev_daa316fd39"
              key={id}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : 'opacity-60'}`
              }
              style={{ backgroundColor: p.color }}
              title={p.name}>

                {i + 1}
              </div>);

          })}
          <span data-ev-id="ev_a90e3ae77d" className="text-slate-600 text-xs ml-1">
            {gameState.turnDirection === 1 ? '→' : '←'}
          </span>
        </div>
      </div>
      
      {/* Players List */}
      <div data-ev-id="ev_0667b30674" className="backdrop-blur-sm border overflow-hidden pointer-events-auto flex-1 flex-col min-h-0 bg-slate-800/95 pr-[0px] pl-[0px] mr-0 ml-4 flex gap-[0px] border-slate-700 rounded-xl">
        <div data-ev-id="ev_39eb0c291c" className="p-3 border-b border-slate-700 flex items-center justify-between">
          <h3 data-ev-id="ev_bd4c9894d7" className="text-white font-semibold text-sm">Players</h3>
          {alliancesAllowed && !currentPlayer.isAI &&
          <button data-ev-id="ev_31cd67a8e3"
          onClick={() => setDiplomacyOpen(!diplomacyOpen)}
          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors">

              🤝 Diplomacy
            </button>
          }
        </div>
        
        {/* Alliance Requests */}
        {currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI &&
        <div data-ev-id="ev_9a85a62ee5" className="p-2 bg-green-500/10 border-b border-slate-700">
            <div data-ev-id="ev_48a063e0b7" className="text-xs text-green-400 font-semibold mb-1">Alliance Requests:</div>
            {currentPlayer.pendingAllianceRequests.map((fromId) => {
            const fromPlayer = gameState.players[fromId];
            return (
              <div data-ev-id="ev_e65043683b" key={fromId} className="flex items-center justify-between gap-2 py-1">
                  <span data-ev-id="ev_9e130675e8" className="text-white text-xs">{fromPlayer?.name}</span>
                  <div data-ev-id="ev_7f768b8881" className="flex gap-1">
                    <button data-ev-id="ev_53def2a422"
                  onClick={() => onAcceptAlliance(fromId)}
                  className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-400">

                      ✓
                    </button>
                    <button data-ev-id="ev_5275e14c4b"
                  onClick={() => onRejectAlliance(fromId)}
                  className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-400">

                      ✗
                    </button>
                  </div>
                </div>);

          })}
          </div>
        }
        
        {/* Player list with Education and Technology */}
        <div data-ev-id="ev_9816196225" className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
          {players.map((player) => {
            const countries = getPlayerCountries(player.id, gameState.countries);
            const playerResources = getPlayerTotalResources(player.id, gameState.countries);
            const isCurrent = player.id === currentPlayer.id;
            const isAlly = currentPlayer.allies.includes(player.id);
            const hasPendingRequest = currentPlayer.outgoingAllianceRequests.includes(player.id);

            return (
              <div data-ev-id="ev_33d42474fa"
              key={player.id}
              className={`rounded-lg p-2 transition-colors ${
              player.isEliminated ? 'bg-slate-700/30 opacity-50' :
              isCurrent ? 'bg-amber-500/20 border border-amber-500/50' :
              isAlly ? 'bg-green-500/20 border border-green-500/50' :
              'bg-slate-700/50 hover:bg-slate-700'}`
              }>

                <div data-ev-id="ev_ce58378602" className="flex items-center gap-2">
                  <div data-ev-id="ev_9121ae44ff"
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }} />

                  <span data-ev-id="ev_e8986de121" className={`text-sm font-medium flex-1 ${
                  player.isEliminated ? 'text-slate-500 line-through' : 'text-white'}`
                  }>
                    {player.name}
                    {isAlly && <span data-ev-id="ev_61f92a6dba" className="ml-1 text-green-400 text-xs">(🤝)</span>}
                  </span>
                  {player.isAI &&
                  <span data-ev-id="ev_85c99cc935" className="text-xs bg-slate-600 text-slate-400 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  }
                </div>
                
                {!player.isEliminated &&
                <div data-ev-id="ev_35a9dbcdac" className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-400">
                    <span data-ev-id="ev_49b619fa09">🌐 {countries.length}</span>
                    <span data-ev-id="ev_7e2ef3bdf9">⚔️ {formatNumber(playerResources.army)}</span>
                    <span data-ev-id="ev_f95211f805">💰 {formatNumber(playerResources.money)}</span>
                    <span data-ev-id="ev_844b148f2b">🎓 {formatNumber(playerResources.education)}</span>
                    <span data-ev-id="ev_1da8f87e9e">🔬 {formatNumber(playerResources.technology)}</span>
                  </div>
                }
                
                {player.isEliminated &&
                <div data-ev-id="ev_eea84121c2" className="text-xs text-red-400 mt-1">Eliminated</div>
                }
                
                {/* Diplomacy actions */}
                {diplomacyOpen && !player.isEliminated && !isCurrent && !currentPlayer.isAI && alliancesAllowed &&
                <div data-ev-id="ev_60530c7f4c" className="mt-2 pt-2 border-t border-slate-600">
                    {isAlly ?
                  <button data-ev-id="ev_4c345b31fa"
                  onClick={() => onBreakAlliance(player.id)}
                  className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 w-full">

                        Break Alliance
                      </button> :
                  hasPendingRequest ?
                  <span data-ev-id="ev_6f46a56df4" className="text-xs text-yellow-400">Request Pending...</span> :

                  <button data-ev-id="ev_6f2183901b"
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
      <div data-ev-id="ev_abb67fbe5d" className="mx-4 mb-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-3 pointer-events-auto">
        <div data-ev-id="ev_0217efc4b9" className="grid grid-cols-4 gap-2 text-center">
          <div data-ev-id="ev_d2110bdd6a">
            <div data-ev-id="ev_1d6dac4d11" className="text-lg">💰</div>
            <div data-ev-id="ev_a58e96bceb" className="text-yellow-400 font-bold text-sm">{formatNumber(resources.money)}</div>
          </div>
          <div data-ev-id="ev_d84eddb342">
            <div data-ev-id="ev_23fff63560" className="text-lg">🎓</div>
            <div data-ev-id="ev_d5b528ecbb" className="text-blue-400 font-bold text-sm">{formatNumber(resources.education)}</div>
          </div>
          <div data-ev-id="ev_90cc371150">
            <div data-ev-id="ev_e016e795a4" className="text-lg">🔬</div>
            <div data-ev-id="ev_956b6cfdf6" className="text-purple-400 font-bold text-sm">{formatNumber(resources.technology)}</div>
          </div>
          <div data-ev-id="ev_be02875ef9">
            <div data-ev-id="ev_dde6245a21" className="text-lg">⚔️</div>
            <div data-ev-id="ev_a11c7c8d41" className="text-red-400 font-bold text-sm">{formatNumber(resources.army)}</div>
          </div>
        </div>
      </div>
      
      {/* End Turn Button */}
      <div data-ev-id="ev_1ff638e6b5" className="px-4 pb-4 pointer-events-auto">
        {pendingActionsCount > 0 &&
        <button data-ev-id="ev_96f7bcfc56"
        onClick={onClearActions}
        className="w-full mb-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">

            Clear Actions ({pendingActionsCount})
          </button>
        }
        
        {/* Warning for pending alliance requests */}
        {currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI &&
        <div data-ev-id="ev_fdd6dc4d5f" className="mb-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-xs">
            ⚠️ You must respond to alliance requests before ending your turn!
          </div>
        }
        
        <button data-ev-id="ev_3d1c630edc"
        onClick={onEndTurn}
        disabled={currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI}
        className={`w-full px-6 py-3 font-bold rounded-lg transition-all transform shadow-lg ${
        currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI ?
        'bg-slate-600 text-slate-400 cursor-not-allowed' :
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 hover:scale-[1.02] active:scale-[0.98]'}`
        }>

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

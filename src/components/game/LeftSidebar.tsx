// Left Sidebar - Menu, Player Info, Player List, Actions
import { useState } from 'react';
import type { GameState, Player, PlannedAction, BuildAction, UpgradeBaseAction } from '@/types/game';
import { BUILDING_COSTS, BASE_UPGRADE_COSTS } from '@/types/game';
import { getPlayerTotalResources, getPlayerCountries, getPlayerTotalProduction } from '@/utils/gameUtils';

interface LeftSidebarProps {
  gameState: GameState;
  currentPlayer: Player;
  pendingActions: PlannedAction[];
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
  pendingActions,
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

  // Calculate base resources
  const baseResources = getPlayerTotalResources(currentPlayer.id, gameState.countries);

  // Calculate pending costs from build/upgrade actions
  let pendingMoneyCost = 0;
  let pendingEducationCost = 0;
  let pendingTechnologyCost = 0;

  pendingActions.forEach((action) => {
    if (action.type === 'build' && action.playerId === currentPlayer.id) {
      const buildData = action.data as BuildAction;
      const cost = BUILDING_COSTS[buildData.buildingType];
      pendingMoneyCost += cost.money;
      pendingEducationCost += cost.education;
      pendingTechnologyCost += cost.technology;
    } else if (action.type === 'upgrade_base' && action.playerId === currentPlayer.id) {
      // Find the country to determine upgrade level
      const upgradeData = action.data as UpgradeBaseAction;
      const country = gameState.countries[upgradeData.countryId];
      if (country) {
        // Count pending upgrades for this country
        const pendingUpgradesForCountry = pendingActions.filter(
          (a) => a.type === 'upgrade_base' &&
          a.playerId === currentPlayer.id &&
          (a.data as UpgradeBaseAction).countryId === upgradeData.countryId
        ).length;
        const upgradeLevel = country.buildings.baseUpgrades + pendingUpgradesForCountry - 1;
        if (upgradeLevel >= 0 && upgradeLevel < BASE_UPGRADE_COSTS.length) {
          const cost = BASE_UPGRADE_COSTS[upgradeLevel];
          pendingMoneyCost += cost.money;
          pendingEducationCost += cost.education;
          pendingTechnologyCost += cost.technology;
        }
      }
    }
  });

  // Resources after pending costs
  const resources = {
    money: baseResources.money - pendingMoneyCost,
    education: baseResources.education - pendingEducationCost,
    technology: baseResources.technology - pendingTechnologyCost,
    army: baseResources.army
  };

  // Get production values
  const production = getPlayerTotalProduction(currentPlayer.id, gameState.countries, gameState.players);

  const countryCount = getPlayerCountries(currentPlayer.id, gameState.countries).length;
  const players = Object.values(gameState.players).filter((p) => !p.isNeutral);
  const activePlayers = gameState.turnOrder.filter(
    (id) => !gameState.players[id].isEliminated && !gameState.players[id].isNeutral
  );

  // Check if alliances are allowed (more than 2 players)
  const alliancesAllowed = activePlayers.length > 2;

  // Check for pending alliance requests
  const hasPendingRequests = currentPlayer.pendingAllianceRequests.length > 0 && !currentPlayer.isAI;

  return (
    <div data-ev-id="ev_267d067900" className="absolute top-0 left-0 bottom-0 z-20 w-64 flex flex-col pointer-events-none">
      {/* Menu Button */}
      <div data-ev-id="ev_139094b327" className="p-4 pointer-events-auto">
        <button data-ev-id="ev_3f1334b49d"
        onClick={() => setMenuOpen(!menuOpen)}
        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-lg transition-all">

          Menu
        </button>
        
        {menuOpen &&
        <div data-ev-id="ev_1a20e8e1fc" className="mt-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-xl">
            <button data-ev-id="ev_36a9472b86"
          onClick={() => {onRestart();setMenuOpen(false);}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors border-b border-slate-700">

              🔄 Restart Game
            </button>
            <button data-ev-id="ev_e1fee9714f"
          onClick={() => {onExit();setMenuOpen(false);}}
          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors">

              🚪 Exit to Setup
            </button>
          </div>
        }
      </div>
      
      {/* Player Info */}
      <div data-ev-id="ev_2738cebb67" className="px-4 pb-2 pointer-events-auto">
        <div data-ev-id="ev_459ea4114d" className="flex items-center gap-3">
          <div data-ev-id="ev_5907ff30dd"
          className="w-10 h-10 rounded-lg shadow-lg flex-shrink-0"
          style={{ backgroundColor: currentPlayer.color }} />

          <div data-ev-id="ev_24f9b42d55">
            <h2 data-ev-id="ev_2585d985d9" className="text-white font-bold text-lg">
              {currentPlayer.name}'s Turn
              {currentPlayer.isAI && <span data-ev-id="ev_43648cfe62" className="ml-2 text-xs bg-slate-700 px-2 py-0.5 rounded">AI</span>}
            </h2>
            <p data-ev-id="ev_93f7c909d1" className="text-slate-400 text-sm">
              Round {gameState.round} • {countryCount} {countryCount === 1 ? 'Country' : 'Countries'}
            </p>
          </div>
        </div>
        
        {/* Turn Order */}
        <div data-ev-id="ev_053bc6e4e4" className="flex items-center gap-1 mt-2">
          <span data-ev-id="ev_53fea3a216" className="text-slate-500 text-xs mr-2">Turn Order:</span>
          {activePlayers.map((id, i) => {
            const p = gameState.players[id];
            const isCurrent = id === currentPlayer.id;
            return (
              <div data-ev-id="ev_f61e24f705"
              key={id}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : 'opacity-60'}`
              }
              style={{ backgroundColor: p.color }}
              title={p.name}>

                {i + 1}
              </div>);

          })}
          <span data-ev-id="ev_1e2c548c53" className="text-slate-600 text-xs ml-1">
            {gameState.turnDirection === 1 ? '→' : '←'}
          </span>
        </div>
      </div>
      
      {/* Players List */}
      <div data-ev-id="ev_9bcb413a29" className="mx-4 mb-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden pointer-events-auto flex-1 flex flex-col min-h-0">
        <div data-ev-id="ev_f65c58bc52" className="p-3 border-b border-slate-700 flex items-center justify-between">
          <h3 data-ev-id="ev_73035d3fd6" className="text-white font-semibold text-sm">Players</h3>
          {alliancesAllowed && !currentPlayer.isAI &&
          <button data-ev-id="ev_363570f4e7"
          onClick={() => setDiplomacyOpen(!diplomacyOpen)}
          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors">

              🤝 Diplomacy
            </button>
          }
        </div>
        
        {/* Alliance Requests - MUST RESPOND */}
        {hasPendingRequests &&
        <div data-ev-id="ev_67d4638158" className="p-2 bg-yellow-500/20 border-b border-yellow-500/30">
            <div data-ev-id="ev_b31fb620ba" className="text-xs text-yellow-400 font-semibold mb-1">⚠️ Alliance Requests (must respond):</div>
            {currentPlayer.pendingAllianceRequests.map((fromId) => {
            const fromPlayer = gameState.players[fromId];
            return (
              <div data-ev-id="ev_872e65a407" key={fromId} className="flex items-center justify-between gap-2 py-1">
                  <div data-ev-id="ev_1c0f316822" className="flex items-center gap-2">
                    <div data-ev-id="ev_641ba5de9c"
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: fromPlayer?.color }} />

                    <span data-ev-id="ev_8c81084c0e" className="text-white text-xs">{fromPlayer?.name}</span>
                  </div>
                  <div data-ev-id="ev_5fce36eb86" className="flex gap-1">
                    <button data-ev-id="ev_954a127187"
                  onClick={() => onAcceptAlliance(fromId)}
                  className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-400">

                      Accept
                    </button>
                    <button data-ev-id="ev_eefcd1f0ff"
                  onClick={() => onRejectAlliance(fromId)}
                  className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-400">

                      Reject
                    </button>
                  </div>
                </div>);

          })}
          </div>
        }
        
        {/* Player list */}
        <div data-ev-id="ev_5dcc7a64be" className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
          {players.map((player) => {
            const countries = getPlayerCountries(player.id, gameState.countries);
            const playerResources = getPlayerTotalResources(player.id, gameState.countries);
            const isCurrent = player.id === currentPlayer.id;
            const isAlly = currentPlayer.allies.includes(player.id);
            const hasPendingRequest = currentPlayer.outgoingAllianceRequests.includes(player.id);

            return (
              <div data-ev-id="ev_f46de3e6bd"
              key={player.id}
              className={`rounded-lg p-2 transition-colors ${
              player.isEliminated ? 'bg-slate-700/30 opacity-50' :
              isCurrent ? 'bg-amber-500/20 border border-amber-500/50' :
              isAlly ? 'bg-green-500/20 border border-green-500/50' :
              'bg-slate-700/50 hover:bg-slate-700'}`
              }>

                <div data-ev-id="ev_0e20c5154d" className="flex items-center gap-2">
                  <div data-ev-id="ev_bf94ac4b96"
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }} />

                  <span data-ev-id="ev_64b4553ba3" className={`text-sm font-medium flex-1 ${
                  player.isEliminated ? 'text-slate-500 line-through' : 'text-white'}`
                  }>
                    {player.name}
                    {isAlly && <span data-ev-id="ev_3c7417442a" className="ml-1 text-green-400 text-xs">(🤝)</span>}
                  </span>
                  {player.isAI &&
                  <span data-ev-id="ev_51956c8348" className="text-xs bg-slate-600 text-slate-400 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  }
                </div>
                
                {!player.isEliminated &&
                <div data-ev-id="ev_d30a27e43e" className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-400">
                    <span data-ev-id="ev_e63f1f9795">🌐 {countries.length}</span>
                    <span data-ev-id="ev_e0d48b5ae3">⚔️ {formatNumber(playerResources.army)}</span>
                    <span data-ev-id="ev_743c1429c5">💰 {formatNumber(playerResources.money)}</span>
                    <span data-ev-id="ev_42025ea686">🎓 {formatNumber(playerResources.education)}</span>
                    <span data-ev-id="ev_7a37619eea">🔬 {formatNumber(playerResources.technology)}</span>
                  </div>
                }
                
                {player.isEliminated &&
                <div data-ev-id="ev_5350afd4e9" className="text-xs text-red-400 mt-1">Eliminated</div>
                }
                
                {/* Diplomacy actions */}
                {diplomacyOpen && !player.isEliminated && !isCurrent && !currentPlayer.isAI && alliancesAllowed &&
                <div data-ev-id="ev_eecab0d726" className="mt-2 pt-2 border-t border-slate-600">
                    {isAlly ?
                  <button data-ev-id="ev_51adfbe52c"
                  onClick={() => onBreakAlliance(player.id)}
                  className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 w-full">

                        Break Alliance
                      </button> :
                  hasPendingRequest ?
                  <span data-ev-id="ev_1b88c4ce6f" className="text-xs text-yellow-400">Request Pending...</span> :

                  <button data-ev-id="ev_602578b64d"
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
      
      {/* Resources Display with Production */}
      <div data-ev-id="ev_a3f92d40a8" className="mx-4 mb-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-3 pointer-events-auto">
        <div data-ev-id="ev_e78512837f" className="grid grid-cols-4 gap-2 text-center">
          <div data-ev-id="ev_0b4a14e3b8">
            <div data-ev-id="ev_4bcb27008f" className="text-lg">💰</div>
            <div data-ev-id="ev_f709382e41" className={`font-bold text-sm ${pendingMoneyCost > 0 ? 'text-amber-400' : 'text-yellow-400'}`}>
              {formatNumber(resources.money)}
            </div>
            <div data-ev-id="ev_fac08a0c96" className={`text-xs ${production.money >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {production.money >= 0 ? '+' : ''}{formatNumber(production.money)}
            </div>
          </div>
          <div data-ev-id="ev_5ae465992c">
            <div data-ev-id="ev_470a5f8003" className="text-lg">🎓</div>
            <div data-ev-id="ev_1a1458e427" className={`font-bold text-sm ${pendingEducationCost > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
              {formatNumber(resources.education)}
            </div>
            <div data-ev-id="ev_ea41f22aac" className="text-xs text-green-400">+{formatNumber(production.education)}</div>
          </div>
          <div data-ev-id="ev_6835c53e1f">
            <div data-ev-id="ev_30a5a5a3e3" className="text-lg">🔬</div>
            <div data-ev-id="ev_9ffab3e31b" className={`font-bold text-sm ${pendingTechnologyCost > 0 ? 'text-amber-400' : 'text-purple-400'}`}>
              {formatNumber(resources.technology)}
            </div>
            <div data-ev-id="ev_f22f992c3a" className={`text-xs ${production.technology >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {production.technology >= 0 ? '+' : ''}{formatNumber(production.technology)}
            </div>
          </div>
          <div data-ev-id="ev_7f29e94e1d">
            <div data-ev-id="ev_20eb1756d7" className="text-lg">⚔️</div>
            <div data-ev-id="ev_4855a4069b" className="text-red-400 font-bold text-sm">{formatNumber(resources.army)}</div>
            <div data-ev-id="ev_c3de5eeb72" className="text-xs text-green-400">+{formatNumber(production.army)}</div>
          </div>
        </div>
      </div>
      
      {/* End Turn Button */}
      <div data-ev-id="ev_14fa4917ee" className="px-4 pb-4 pointer-events-auto">
        {pendingActions.length > 0 &&
        <button data-ev-id="ev_a22e6544b6"
        onClick={onClearActions}
        className="w-full mb-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">

            Clear Actions ({pendingActions.length})
          </button>
        }
        
        {/* Warning for pending alliance requests */}
        {hasPendingRequests &&
        <div data-ev-id="ev_521426eb02" className="mb-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-xs">
            ⚠️ You must respond to alliance requests before ending your turn!
          </div>
        }
        
        <button data-ev-id="ev_1542943447"
        onClick={onEndTurn}
        disabled={hasPendingRequests}
        className={`w-full px-6 py-3 font-bold rounded-lg transition-all transform shadow-lg ${
        hasPendingRequests ?
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

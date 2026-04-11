// Game Setup Screen
import { useState } from 'react';
import type { GameConfig } from '@/types/game';
import { PLAYER_COLORS } from '@/types/game';

interface SetupScreenProps {
  onStartGame: (config: GameConfig) => void;
}

export function SetupScreen({ onStartGame }: SetupScreenProps) {
  const [mapWidth, setMapWidth] = useState(8);
  const [mapHeight, setMapHeight] = useState(6);
  const [playerCount, setPlayerCount] = useState(1);
  const [aiCount, setAiCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1']);
  const [initialAlliances, setInitialAlliances] = useState<[number, number][]>([]);
  const [showAllianceSetup, setShowAllianceSetup] = useState(false);

  const totalPlayers = playerCount + aiCount;
  const maxPlayers = Math.min(8, mapWidth * mapHeight - 1);

  // Generate all player names including AI
  const allPlayerNames = [
  ...playerNames,
  ...Array.from({ length: aiCount }, (_, i) => `AI ${i + 1}`)];


  const handlePlayerCountChange = (count: number) => {
    const newCount = Math.min(count, maxPlayers - aiCount);
    setPlayerCount(newCount);

    const newNames = [...playerNames];
    while (newNames.length < newCount) {
      newNames.push(`Player ${newNames.length + 1}`);
    }
    while (newNames.length > newCount) {
      newNames.pop();
    }
    setPlayerNames(newNames);

    // Clear invalid alliances
    setInitialAlliances((prev) => prev.filter(
      ([a, b]) => a < newCount + aiCount && b < newCount + aiCount
    ));
  };

  const handleAiCountChange = (count: number) => {
    const newAiCount = Math.min(count, maxPlayers - playerCount);
    setAiCount(newAiCount);

    // Clear invalid alliances
    setInitialAlliances((prev) => prev.filter(
      ([a, b]) => a < playerCount + newAiCount && b < playerCount + newAiCount
    ));
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const toggleAlliance = (idx1: number, idx2: number) => {
    // Ensure idx1 < idx2 for consistent storage
    const [a, b] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];

    setInitialAlliances((prev) => {
      const exists = prev.some(([x, y]) => x === a && y === b);
      if (exists) {
        return prev.filter(([x, y]) => !(x === a && y === b));
      } else {
        return [...prev, [a, b]];
      }
    });
  };

  const isAllied = (idx1: number, idx2: number): boolean => {
    const [a, b] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];
    return initialAlliances.some(([x, y]) => x === a && y === b);
  };

  const handleStartGame = () => {
    const allNames = [...playerNames];
    for (let i = 0; i < aiCount; i++) {
      allNames.push(`AI ${i + 1}`);
    }

    // Convert alliance indices to string pairs
    const alliancePairs = initialAlliances.map(([a, b]) => [`${a}`, `${b}`] as [string, string]);

    onStartGame({
      mapWidth,
      mapHeight,
      playerCount,
      aiCount,
      playerNames: allNames,
      playerColors: PLAYER_COLORS.slice(0, totalPlayers),
      initialAlliances: initialAlliances
    });
  };

  return (
    <div data-ev-id="ev_96cc86d6f1" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div data-ev-id="ev_4c408b64d8" className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div data-ev-id="ev_80a921f727" className="text-center mb-8">
          <h1 data-ev-id="ev_a9d72f5cbd" className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
            HexRuler
          </h1>
          <p data-ev-id="ev_cbff48a17e" className="text-slate-400">Turn-Based Strategy</p>
        </div>
        
        {/* Map Size */}
        <div data-ev-id="ev_3feff42908" className="mb-6">
          <label data-ev-id="ev_a7d87e9570" className="block text-slate-300 font-semibold mb-3">Map Size</label>
          <div data-ev-id="ev_56248027e7" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_f2c9b9d5ef">
              <label data-ev-id="ev_9ebc3bf787" className="block text-slate-400 text-sm mb-1">Width</label>
              <input data-ev-id="ev_bd57252e73"
              type="range"
              min={2}
              max={20}
              value={mapWidth}
              onChange={(e) => setMapWidth(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_0cb399a54f" className="text-center text-amber-400 font-mono">{mapWidth}</div>
            </div>
            <div data-ev-id="ev_a78ed17347">
              <label data-ev-id="ev_d2b1f6ec6f" className="block text-slate-400 text-sm mb-1">Height</label>
              <input data-ev-id="ev_effbc3ba26"
              type="range"
              min={2}
              max={20}
              value={mapHeight}
              onChange={(e) => setMapHeight(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_e1a4a794ec" className="text-center text-amber-400 font-mono">{mapHeight}</div>
            </div>
          </div>
          <p data-ev-id="ev_f0507ba8f3" className="text-slate-500 text-xs mt-2 text-center">
            {mapWidth * mapHeight} total hexes • Max {maxPlayers} players
          </p>
        </div>
        
        {/* Player Counts */}
        <div data-ev-id="ev_103f3a5527" className="mb-6">
          <label data-ev-id="ev_fa3c92d5f6" className="block text-slate-300 font-semibold mb-3">Players</label>
          <div data-ev-id="ev_36a86bed7c" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_aef7cb3f7e">
              <label data-ev-id="ev_e6cce6e53f" className="block text-slate-400 text-sm mb-1">Human Players</label>
              <input data-ev-id="ev_faa8a48cd4"
              type="number"
              min={1}
              max={maxPlayers - 1}
              value={playerCount}
              onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
            <div data-ev-id="ev_1175ffc25d">
              <label data-ev-id="ev_b7a2ab765d" className="block text-slate-400 text-sm mb-1">AI Players</label>
              <input data-ev-id="ev_0853cd1a4e"
              type="number"
              min={1}
              max={maxPlayers - playerCount}
              value={aiCount}
              onChange={(e) => handleAiCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
          </div>
          <p data-ev-id="ev_60bc568aba" className="text-slate-500 text-xs mt-2 text-center">
            Total: {totalPlayers} players (+ neutral countries)
          </p>
        </div>
        
        {/* Player Names */}
        <div data-ev-id="ev_ce4ef9d1b6" className="mb-6">
          <label data-ev-id="ev_49c88402aa" className="block text-slate-300 font-semibold mb-3">Player Names</label>
          <div data-ev-id="ev_0348928407" className="flex flex-col gap-2">
            {playerNames.map((name, i) =>
            <div data-ev-id="ev_3e08c0c90f" key={i} className="flex items-center gap-3">
                <div data-ev-id="ev_1f7ed58865"
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: PLAYER_COLORS[i] }} />

                <input data-ev-id="ev_68d4ed1b07"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={`Player ${i + 1}`} />

              </div>
            )}
          </div>
        </div>
        
        {/* Alliance Setup */}
        <div data-ev-id="ev_030fbc0ee8" className="mb-6">
          <div data-ev-id="ev_24a6824057" className="flex items-center justify-between mb-3">
            <label data-ev-id="ev_8e8a1fa9b0" className="block text-slate-300 font-semibold">🤝 Initial Alliances</label>
            <button data-ev-id="ev_2c2cde3bf1"
            onClick={() => setShowAllianceSetup(!showAllianceSetup)}
            className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-500/30 transition-colors">

              {showAllianceSetup ? 'Hide' : 'Configure'}
            </button>
          </div>
          
          {showAllianceSetup &&
          <div data-ev-id="ev_92809f83fd" className="bg-slate-700/50 rounded-lg p-4">
              <p data-ev-id="ev_888d915905" className="text-slate-400 text-xs mb-3">
                Click on a pair to toggle alliance. Allied players cannot attack each other at game start.
              </p>
              
              {totalPlayers < 3 ?
            <p data-ev-id="ev_5a1b1c2553" className="text-slate-500 text-sm text-center py-2">Need at least 3 players for alliances</p> :

            <div data-ev-id="ev_45423c19fd" className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {Array.from({ length: totalPlayers }).map((_, i) =>
              Array.from({ length: totalPlayers }).map((_, j) => {
                if (j <= i) return null;
                const allied = isAllied(i, j);
                return (
                  <button data-ev-id="ev_d6309e4edc"
                  key={`${i}-${j}`}
                  onClick={() => toggleAlliance(i, j)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  allied ?
                  'bg-green-500/30 border border-green-500/50 hover:bg-green-500/40' :
                  'bg-slate-600/50 hover:bg-slate-600'}`
                  }>

                          <div data-ev-id="ev_a9df0d2df7"
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: PLAYER_COLORS[i] }} />

                          <span data-ev-id="ev_ecf56d67fa" className="text-white text-sm">{allPlayerNames[i]}</span>
                          <span data-ev-id="ev_4eb1eb4be7" className="text-slate-400 mx-1">↔</span>
                          <div data-ev-id="ev_6e950b4587"
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: PLAYER_COLORS[j] }} />

                          <span data-ev-id="ev_c15d47aee4" className="text-white text-sm">{allPlayerNames[j]}</span>
                          {allied &&
                    <span data-ev-id="ev_223be9ec91" className="ml-auto text-green-400 text-xs">✓ Allied</span>
                    }
                        </button>);

              })
              )}
                </div>
            }
              
              {initialAlliances.length > 0 &&
            <div data-ev-id="ev_e85e21778c" className="mt-3 pt-3 border-t border-slate-600">
                  <span data-ev-id="ev_aaee9c5e0d" className="text-slate-400 text-xs">Active alliances: {initialAlliances.length}</span>
                </div>
            }
            </div>
          }
        </div>
        
        {/* Start Button */}
        <button data-ev-id="ev_d4c433ccde"
        onClick={handleStartGame}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">

          Start Game
        </button>
        
        {/* Rules Summary */}
        <div data-ev-id="ev_0cede6fa6c" className="mt-6 pt-6 border-t border-slate-700">
          <h3 data-ev-id="ev_e2948197bd" className="text-slate-400 font-semibold text-sm mb-2">Quick Rules</h3>
          <ul data-ev-id="ev_124f2c3c5c" className="text-slate-500 text-xs flex flex-col gap-1">
            <li data-ev-id="ev_86d11424e6">• Conquer all enemy countries to win</li>
            <li data-ev-id="ev_4cd45a11d0">• Build Cities → Universities → Factories → Bases</li>
            <li data-ev-id="ev_9f42cc09a9">• Bases produce Army for attacking (can be upgraded twice)</li>
            <li data-ev-id="ev_5130d28bda">• Buildings have upkeep costs each turn</li>
            <li data-ev-id="ev_062332c331">• Attacker must have MORE army than defender</li>
            <li data-ev-id="ev_2355233da7">• Turn order reverses each round (snake draft)</li>
            <li data-ev-id="ev_986f1c192f">• 🤝 Alliances: Request in-game or set above. Allies cannot attack each other.</li>
          </ul>
        </div>
      </div>
    </div>);

}

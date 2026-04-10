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

  const totalPlayers = playerCount + aiCount;
  const maxPlayers = Math.min(8, mapWidth * mapHeight - 1);

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
  };

  const handleAiCountChange = (count: number) => {
    setAiCount(Math.min(count, maxPlayers - playerCount));
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const allNames = [...playerNames];
    for (let i = 0; i < aiCount; i++) {
      allNames.push(`AI ${i + 1}`);
    }

    onStartGame({
      mapWidth,
      mapHeight,
      playerCount,
      aiCount,
      playerNames: allNames,
      playerColors: PLAYER_COLORS.slice(0, totalPlayers)
    });
  };

  return (
    <div data-ev-id="ev_9c9e871053" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div data-ev-id="ev_e0ac381d24" className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-700">
        {/* Title */}
        <div data-ev-id="ev_8e54642b60" className="text-center mb-8">
          <h1 data-ev-id="ev_0b4d4e1ec8" className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
            HexRuler
          </h1>
          <p data-ev-id="ev_4e46d4c3be" className="text-slate-400">Turn-Based Strategy</p>
        </div>
        
        {/* Map Size */}
        <div data-ev-id="ev_963b777660" className="mb-6">
          <label data-ev-id="ev_b861fb44b7" className="block text-slate-300 font-semibold mb-3">Map Size</label>
          <div data-ev-id="ev_ae5fca1f5e" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_d86f2835f9">
              <label data-ev-id="ev_bbd3ae748d" className="block text-slate-400 text-sm mb-1">Width</label>
              <input data-ev-id="ev_937a58c3c7"
              type="range"
              min={2}
              max={20}
              value={mapWidth}
              onChange={(e) => setMapWidth(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_8cf7c73c4d" className="text-center text-amber-400 font-mono">{mapWidth}</div>
            </div>
            <div data-ev-id="ev_02a571d994">
              <label data-ev-id="ev_381f276323" className="block text-slate-400 text-sm mb-1">Height</label>
              <input data-ev-id="ev_d663c05c19"
              type="range"
              min={2}
              max={20}
              value={mapHeight}
              onChange={(e) => setMapHeight(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_3f005523e9" className="text-center text-amber-400 font-mono">{mapHeight}</div>
            </div>
          </div>
          <p data-ev-id="ev_1b5b43445d" className="text-slate-500 text-xs mt-2 text-center">
            {mapWidth * mapHeight} total hexes • Max {maxPlayers} players
          </p>
        </div>
        
        {/* Player Counts */}
        <div data-ev-id="ev_80a921f727" className="mb-6">
          <label data-ev-id="ev_b291267634" className="block text-slate-300 font-semibold mb-3">Players</label>
          <div data-ev-id="ev_f80b9318df" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_387bdbb009">
              <label data-ev-id="ev_7a911a3b71" className="block text-slate-400 text-sm mb-1">Human Players</label>
              <input data-ev-id="ev_c85216ad97"
              type="number"
              min={1}
              max={maxPlayers - 1}
              value={playerCount}
              onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
            <div data-ev-id="ev_1e44bdfe2c">
              <label data-ev-id="ev_b2db325d67" className="block text-slate-400 text-sm mb-1">AI Players</label>
              <input data-ev-id="ev_11147a2d80"
              type="number"
              min={1}
              max={maxPlayers - playerCount}
              value={aiCount}
              onChange={(e) => handleAiCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
          </div>
          <p data-ev-id="ev_603561f17a" className="text-slate-500 text-xs mt-2 text-center">
            Total: {totalPlayers} players (+ neutral countries)
          </p>
        </div>
        
        {/* Player Names */}
        <div data-ev-id="ev_35dd9fafe4" className="mb-8">
          <label data-ev-id="ev_0aaf871bcd" className="block text-slate-300 font-semibold mb-3">Player Names</label>
          <div data-ev-id="ev_9cac7672b0" className="flex flex-col gap-2">
            {playerNames.map((name, i) =>
            <div data-ev-id="ev_7a3b3dc12a" key={i} className="flex items-center gap-3">
                <div data-ev-id="ev_e08da17721"
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: PLAYER_COLORS[i] }} />

                <input data-ev-id="ev_70a224ae08"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={`Player ${i + 1}`} />

              </div>
            )}
          </div>
        </div>
        
        {/* Start Button */}
        <button data-ev-id="ev_956dea2d15"
        onClick={handleStartGame}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">

          Start Game
        </button>
        
        {/* Rules Summary */}
        <div data-ev-id="ev_1bd0727ae7" className="mt-6 pt-6 border-t border-slate-700">
          <h3 data-ev-id="ev_5e886435b8" className="text-slate-400 font-semibold text-sm mb-2">Quick Rules</h3>
          <ul data-ev-id="ev_04d215f99c" className="text-slate-500 text-xs flex flex-col gap-1">
            <li data-ev-id="ev_0d4c79200b">• Conquer all enemy countries to win</li>
            <li data-ev-id="ev_e5c1fa4edb">• Build Cities → Universities → Factories → Bases</li>
            <li data-ev-id="ev_dfaba28d81">• Bases produce Army for attacking</li>
            <li data-ev-id="ev_644a21694c">• Attacker must have MORE army than defender</li>
            <li data-ev-id="ev_b57630e1e5">• Turn order reverses each round (snake draft)</li>
            <li data-ev-id="ev_c3a2b89999">• 🤝 <span data-ev-id="ev_fa0c68ef45" className="text-blue-400">Alliances:</span> Request alliances with other players. Allies cannot attack each other. Alliances auto-break when only 2 players remain.</li>
          </ul>
        </div>
      </div>
    </div>);

}

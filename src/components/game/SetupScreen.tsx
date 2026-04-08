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

    // Adjust names array
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
    // Generate names for AI players
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
    <div data-ev-id="ev_4fd3a69758" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div data-ev-id="ev_c5dc560583" className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-700">
        {/* Title */}
        <div data-ev-id="ev_ea04493bdf" className="text-center mb-8">
          <h1 data-ev-id="ev_fa19c34f75" className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
            HexRuler
          </h1>
          <p data-ev-id="ev_0b8e9486f5" className="text-slate-400">Turn-Based Strategy</p>
        </div>
        
        {/* Map Size */}
        <div data-ev-id="ev_c0a843b0eb" className="mb-6">
          <label data-ev-id="ev_66bd1830dc" className="block text-slate-300 font-semibold mb-3">Map Size</label>
          <div data-ev-id="ev_a370021832" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_1abb70248a">
              <label data-ev-id="ev_c5b0e5eb29" className="block text-slate-400 text-sm mb-1">Width</label>
              <input data-ev-id="ev_6c40f37dfa"
              type="range"
              min={2}
              max={20}
              value={mapWidth}
              onChange={(e) => setMapWidth(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_2622dcb732" className="text-center text-amber-400 font-mono">{mapWidth}</div>
            </div>
            <div data-ev-id="ev_fafe692b20">
              <label data-ev-id="ev_37a0b26ec8" className="block text-slate-400 text-sm mb-1">Height</label>
              <input data-ev-id="ev_c1f908b794"
              type="range"
              min={2}
              max={20}
              value={mapHeight}
              onChange={(e) => setMapHeight(parseInt(e.target.value))}
              className="w-full accent-amber-500" />

              <div data-ev-id="ev_e84bd04e1c" className="text-center text-amber-400 font-mono">{mapHeight}</div>
            </div>
          </div>
          <p data-ev-id="ev_226043c501" className="text-slate-500 text-xs mt-2 text-center">
            {mapWidth * mapHeight} total hexes • Max {maxPlayers} players
          </p>
        </div>
        
        {/* Player Counts */}
        <div data-ev-id="ev_67a9dabab8" className="mb-6">
          <label data-ev-id="ev_de850ded2b" className="block text-slate-300 font-semibold mb-3">Players</label>
          <div data-ev-id="ev_bb5eb436b9" className="grid grid-cols-2 gap-4">
            <div data-ev-id="ev_8d66f843c3">
              <label data-ev-id="ev_cd7fcca657" className="block text-slate-400 text-sm mb-1">Human Players</label>
              <input data-ev-id="ev_1cdcf29ef2"
              type="number"
              min={1}
              max={maxPlayers - 1}
              value={playerCount}
              onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
            <div data-ev-id="ev_02fb144cc5">
              <label data-ev-id="ev_069d6f1a0d" className="block text-slate-400 text-sm mb-1">AI Players</label>
              <input data-ev-id="ev_874f64c1ee"
              type="number"
              min={1}
              max={maxPlayers - playerCount}
              value={aiCount}
              onChange={(e) => handleAiCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />

            </div>
          </div>
          <p data-ev-id="ev_0ea7726a02" className="text-slate-500 text-xs mt-2 text-center">
            Total: {totalPlayers} players (+ neutral countries)
          </p>
        </div>
        
        {/* Player Names */}
        <div data-ev-id="ev_d27cada236" className="mb-8">
          <label data-ev-id="ev_de9e701a57" className="block text-slate-300 font-semibold mb-3">Player Names</label>
          <div data-ev-id="ev_fad7da6508" className="flex flex-col gap-2">
            {playerNames.map((name, i) =>
            <div data-ev-id="ev_41b400f0d6" key={i} className="flex items-center gap-3">
                <div data-ev-id="ev_a96c7474cc"
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: PLAYER_COLORS[i] }} />

                <input data-ev-id="ev_e2e388b2ef"
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
        <button data-ev-id="ev_d5c8421d30"
        onClick={handleStartGame}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">

          Start Game
        </button>
        
        {/* Rules Summary */}
        <div data-ev-id="ev_af79395887" className="mt-6 pt-6 border-t border-slate-700">
          <h3 data-ev-id="ev_c18148daa8" className="text-slate-400 font-semibold text-sm mb-2">Quick Rules</h3>
          <ul data-ev-id="ev_7b0a593bb7" className="text-slate-500 text-xs flex flex-col gap-1">
            <li data-ev-id="ev_dfaba28d81">• Conquer all enemy countries to win</li>
            <li data-ev-id="ev_644a21694c">• Build Cities → Universities → Factories → Bases</li>
            <li data-ev-id="ev_b57630e1e5">• Bases produce Army for attacking</li>
            <li data-ev-id="ev_c3a2b89999">• Attacker must have MORE army than defender</li>
            <li data-ev-id="ev_2504ecac83">• Turn order reverses each round (snake draft)</li>
          </ul>
        </div>
      </div>
    </div>);

}

// Country Info Panel - Shows selected country details and actions
import { useState } from 'react';
import type { GameState, Country, Player, PlannedAction, BuildAction, MoveAction, AttackAction } from '@/types/game';
import { BUILDING_COSTS, BUILDING_LIMITS } from '@/types/game';
import { canBuild, getAttackableCountries, getPlayerCountries, getPlayerTotalResources } from '@/utils/gameUtils';
import { areNeighbors, coordToId } from '@/utils/hexUtils';

interface CountryPanelProps {
  country: Country;
  owner: Player | null;
  currentPlayer: Player;
  gameState: GameState;
  pendingActions: PlannedAction[];
  onBuild: (buildingType: 'city' | 'university' | 'factory' | 'base') => boolean;
  onMove: (toCountryId: string, amount: number) => boolean;
  onAttack: (toCountryId: string, amount: number) => boolean;
  onClose: () => void;
}

export function CountryPanel({
  country,
  owner,
  currentPlayer,
  gameState,
  pendingActions,
  onBuild,
  onMove,
  onAttack,
  onClose
}: CountryPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'build' | 'move' | 'attack'>('info');
  const [moveTarget, setMoveTarget] = useState<string>('');
  const [moveAmount, setMoveAmount] = useState<number>(100);
  const [attackTarget, setAttackTarget] = useState<string>('');
  const [attackAmount, setAttackAmount] = useState<number>(100);

  const isOwned = country.ownerId === currentPlayer.id;
  const resources = getPlayerTotalResources(currentPlayer.id, gameState.countries);

  // Calculate pending resource changes
  pendingActions.forEach((action) => {
    if (action.type === 'build' && action.playerId === currentPlayer.id) {
      const buildData = action.data as BuildAction;
      const cost = BUILDING_COSTS[buildData.buildingType];
      resources.money -= cost.money;
      resources.education -= cost.education;
      resources.technology -= cost.technology;
    }
  });

  // Calculate available army in this country
  let availableArmy = country.resources.army;
  pendingActions.forEach((action) => {
    if (action.type === 'move' || action.type === 'attack') {
      const data = action.data as MoveAction | AttackAction;
      if (data.fromCountryId === country.id) {
        availableArmy -= data.amount;
      }
      if (action.type === 'move' && data.toCountryId === country.id) {
        availableArmy += data.amount;
      }
    }
  });

  // Get pending building counts for this country
  const pendingBuilds: Record<string, number> = { city: 0, university: 0, factory: 0, base: 0 };
  pendingActions.forEach((action) => {
    if (action.type === 'build') {
      const data = action.data as BuildAction;
      if (data.countryId === country.id) {
        pendingBuilds[data.buildingType]++;
      }
    }
  });

  const effectiveBuildings = {
    cities: country.buildings.cities + pendingBuilds.city,
    universities: country.buildings.universities + pendingBuilds.university,
    factories: country.buildings.factories + pendingBuilds.factory,
    bases: country.buildings.bases + pendingBuilds.base
  };

  // Get valid move targets
  const playerCountries = getPlayerCountries(currentPlayer.id, gameState.countries).filter((c) => c.id !== country.id);

  // Get valid attack targets
  const attackableCountries = isOwned ? getAttackableCountries(country, gameState.countries, currentPlayer) : [];

  const handleBuild = (type: 'city' | 'university' | 'factory' | 'base') => {
    if (onBuild(type)) {

      // Success feedback could go here
    }};

  const handleMove = () => {
    if (moveTarget && moveAmount > 0) {
      if (onMove(moveTarget, moveAmount)) {
        setMoveAmount(100);
      }
    }
  };

  const handleAttack = () => {
    if (attackTarget && attackAmount >= 100) {
      if (onAttack(attackTarget, attackAmount)) {
        setAttackAmount(100);
      }
    }
  };

  return (
    <div data-ev-id="ev_c863b436b0" className="absolute bottom-4 left-4 z-20 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div data-ev-id="ev_a2b8c245fb" className="flex items-center justify-between p-4 border-b border-slate-700">
        <div data-ev-id="ev_355be8627a" className="flex items-center gap-3">
          <div data-ev-id="ev_540b81aee1"
          className="w-6 h-6 rounded-lg"
          style={{ backgroundColor: owner?.color || '#6B7280' }} />

          <div data-ev-id="ev_d8606ffae7">
            <h3 data-ev-id="ev_8daf464f04" className="text-white font-bold">{owner?.name || 'Neutral'}</h3>
            <p data-ev-id="ev_a6200daf5f" className="text-slate-400 text-xs">({country.coord.q}, {country.coord.r})</p>
          </div>
        </div>
        <button data-ev-id="ev_9b33d9a0ed"
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1">

          ✕
        </button>
      </div>
      
      {/* Tabs */}
      {isOwned &&
      <div data-ev-id="ev_3aef76edc5" className="flex border-b border-slate-700">
          {(['info', 'build', 'move', 'attack'] as const).map((tab) =>
        <button data-ev-id="ev_edca98cd73"
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-2 text-sm font-semibold transition-colors ${
        activeTab === tab ?
        'bg-slate-700 text-amber-400' :
        'text-slate-400 hover:text-white hover:bg-slate-700/50'}`
        }>

              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
        )}
        </div>
      }
      
      {/* Content */}
      <div data-ev-id="ev_49e7b68817" className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'info' &&
        <div data-ev-id="ev_9c00a36fd3" className="flex flex-col gap-4">
            {/* Resources */}
            <div data-ev-id="ev_3fd7095d1d">
              <h4 data-ev-id="ev_c727ddb487" className="text-slate-400 text-xs font-semibold mb-2">RESOURCES</h4>
              <div data-ev-id="ev_e4e69b78b0" className="grid grid-cols-2 gap-2">
                <ResourceRow icon="💰" label="Money" value={country.resources.money} />
                <ResourceRow icon="🎓" label="Education" value={country.resources.education} />
                <ResourceRow icon="🔬" label="Technology" value={country.resources.technology} />
                <ResourceRow icon="⚔️" label="Army" value={availableArmy} highlight={availableArmy !== country.resources.army} />
              </div>
            </div>
            
            {/* Buildings */}
            <div data-ev-id="ev_7c1dc369b2">
              <h4 data-ev-id="ev_5eef8e5b1a" className="text-slate-400 text-xs font-semibold mb-2">BUILDINGS</h4>
              <div data-ev-id="ev_e0f969f7f0" className="grid grid-cols-2 gap-2">
                <BuildingRow icon="🏙️" label="Cities" value={effectiveBuildings.cities} max={4} pending={pendingBuilds.city} />
                <BuildingRow icon="🎓" label="Universities" value={effectiveBuildings.universities} max={2} pending={pendingBuilds.university} />
                <BuildingRow icon="🏭" label="Factories" value={effectiveBuildings.factories} max={8} pending={pendingBuilds.factory} />
                <BuildingRow icon="🏰" label="Bases" value={effectiveBuildings.bases} max={2} pending={pendingBuilds.base} />
              </div>
            </div>
          </div>
        }
        
        {activeTab === 'build' && isOwned &&
        <div data-ev-id="ev_ef9a5df730" className="flex flex-col gap-3">
            {(['city', 'university', 'factory', 'base'] as const).map((type) => {
            const tempCountry = { ...country, buildings: effectiveBuildings };
            const check = canBuild(tempCountry, type, resources);
            const cost = BUILDING_COSTS[type];
            const limit = BUILDING_LIMITS[type];
            const current = effectiveBuildings[type === 'city' ? 'cities' : type === 'university' ? 'universities' : type === 'factory' ? 'factories' : 'bases'];

            return (
              <div data-ev-id="ev_eefc2174fc" key={type} className="bg-slate-700/50 rounded-lg p-3">
                  <div data-ev-id="ev_accd3bca18" className="flex items-center justify-between mb-2">
                    <span data-ev-id="ev_ba2ae3e071" className="text-white font-semibold capitalize">
                      {getBuildingEmoji(type)} {type}
                    </span>
                    <span data-ev-id="ev_a1481de489" className="text-slate-400 text-xs">{current}/{limit}</span>
                  </div>
                  <div data-ev-id="ev_02efe1c259" className="text-xs text-slate-400 mb-2">
                    Cost: {cost.money > 0 && `💰${cost.money.toLocaleString()}`}
                    {cost.education > 0 && ` 🎓${cost.education.toLocaleString()}`}
                    {cost.technology > 0 && ` 🔬${cost.technology.toLocaleString()}`}
                  </div>
                  <button data-ev-id="ev_07385d64f6"
                onClick={() => handleBuild(type)}
                disabled={!check.canBuild}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                check.canBuild ?
                'bg-amber-500 hover:bg-amber-400 text-slate-900' :
                'bg-slate-600 text-slate-400 cursor-not-allowed'}`
                }>

                    {check.canBuild ? 'Build' : check.reason}
                  </button>
                </div>);

          })}
          </div>
        }
        
        {activeTab === 'move' && isOwned &&
        <div data-ev-id="ev_49c6f61ca5" className="flex flex-col gap-4">
            <div data-ev-id="ev_29734e6efe" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_fe3fee142a" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
            </div>
            
            {playerCountries.length > 0 ?
          <>
                <div data-ev-id="ev_57d6526bb5">
                  <label data-ev-id="ev_c57d01362f" className="block text-slate-400 text-xs mb-1">Destination</label>
                  <select data-ev-id="ev_eaddf35fe3"
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_819d26c72a" value="">Select country...</option>
                    {playerCountries.map((c) =>
                <option data-ev-id="ev_c9b6ecea94" key={c.id} value={c.id}>
                        ({c.coord.q}, {c.coord.r}) - {c.resources.army.toLocaleString()} army
                      </option>
                )}
                  </select>
                </div>
                
                <div data-ev-id="ev_eb1c35c45d">
                  <label data-ev-id="ev_2820054318" className="block text-slate-400 text-xs mb-1">Amount</label>
                  <input data-ev-id="ev_9f152198a5"
              type="number"
              min={1}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(Math.min(parseInt(e.target.value) || 0, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_b2e87de94b"
              type="range"
              min={0}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-amber-500" />

                </div>
                
                <button data-ev-id="ev_3c3e8c1bb1"
            onClick={handleMove}
            disabled={!moveTarget || moveAmount < 1 || moveAmount > availableArmy}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            moveTarget && moveAmount > 0 && moveAmount <= availableArmy ?
            'bg-blue-500 hover:bg-blue-400 text-white' :
            'bg-slate-600 text-slate-400 cursor-not-allowed'}`
            }>

                  Move Army
                </button>
              </> :

          <p data-ev-id="ev_2295c88958" className="text-slate-500 text-sm">No other countries to move to.</p>
          }
          </div>
        }
        
        {activeTab === 'attack' && isOwned &&
        <div data-ev-id="ev_41cce0dd33" className="flex flex-col gap-4">
            <div data-ev-id="ev_7ccd601b87" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_54e235f363" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
              {availableArmy < 100 && <span data-ev-id="ev_072e6e55bc" className="text-red-400 ml-2">(Min 100 to attack)</span>}
            </div>
            
            {attackableCountries.length > 0 ?
          <>
                <div data-ev-id="ev_7d11d61766">
                  <label data-ev-id="ev_358fc29036" className="block text-slate-400 text-xs mb-1">Target</label>
                  <select data-ev-id="ev_96aaf0a81e"
              value={attackTarget}
              onChange={(e) => setAttackTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_83a5348995" value="">Select target...</option>
                    {attackableCountries.map((c) => {
                  const targetOwner = c.ownerId ? gameState.players[c.ownerId] : null;
                  return (
                    <option data-ev-id="ev_a0876d9efb" key={c.id} value={c.id}>
                          {targetOwner?.name || 'Neutral'} - ⚔️{c.resources.army.toLocaleString()}
                        </option>);

                })}
                  </select>
                </div>
                
                <div data-ev-id="ev_c8dffba27b">
                  <label data-ev-id="ev_0836ffd976" className="block text-slate-400 text-xs mb-1">Attack Force</label>
                  <input data-ev-id="ev_e0c8475aad"
              type="number"
              min={100}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(Math.min(parseInt(e.target.value) || 100, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_eee02aa611"
              type="range"
              min={100}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-red-500" />

                </div>
                
                {attackTarget &&
            <div data-ev-id="ev_3232138dcb" className="bg-slate-700/50 rounded-lg p-3">
                    <div data-ev-id="ev_76c0502511" className="text-xs text-slate-400 mb-1">Battle Prediction</div>
                    <div data-ev-id="ev_56671f4795" className="text-sm">
                      {(() => {
                  const target = gameState.countries[attackTarget];
                  if (!target) return null;
                  const defenderArmy = target.resources.army;
                  if (attackAmount > defenderArmy) {
                    return <span data-ev-id="ev_174025385a" className="text-green-400">WIN - {(attackAmount - defenderArmy).toLocaleString()} army survives</span>;
                  } else if (attackAmount === defenderArmy) {
                    return <span data-ev-id="ev_edd8528c4e" className="text-yellow-400">TIE - Defender wins, both armies lost</span>;
                  } else {
                    return <span data-ev-id="ev_ed877eba25" className="text-red-400">LOSE - Need more than {defenderArmy.toLocaleString()}</span>;
                  }
                })()}
                    </div>
                  </div>
            }
                
                <button data-ev-id="ev_74bc196cfd"
            onClick={handleAttack}
            disabled={!attackTarget || attackAmount < 100 || attackAmount > availableArmy}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            attackTarget && attackAmount >= 100 && attackAmount <= availableArmy ?
            'bg-red-500 hover:bg-red-400 text-white' :
            'bg-slate-600 text-slate-400 cursor-not-allowed'}`
            }>

                  ⚔️ Attack
                </button>
              </> :

          <p data-ev-id="ev_ef36df9d1c" className="text-slate-500 text-sm">
                {availableArmy < 100 ?
            'Need at least 100 army to attack.' :
            'No adjacent enemy countries to attack.'}
              </p>
          }
          </div>
        }
      </div>
    </div>);

}

function ResourceRow({ icon, label, value, highlight }: {icon: string;label: string;value: number;highlight?: boolean;}) {
  return (
    <div data-ev-id="ev_cc3d0b23e0" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_61200b260b">{icon}</span>
      <span data-ev-id="ev_9ee121a7ea" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_d9bfb98bed" className={`ml-auto font-bold text-sm ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </span>
    </div>);

}

function BuildingRow({ icon, label, value, max, pending }: {icon: string;label: string;value: number;max: number;pending: number;}) {
  return (
    <div data-ev-id="ev_88e804609c" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_b249be355d">{icon}</span>
      <span data-ev-id="ev_7c8deb01f3" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_7f4f94ec06" className="ml-auto font-bold text-sm text-white">
        {value - pending}
        {pending > 0 && <span data-ev-id="ev_658d408a2f" className="text-amber-400">+{pending}</span>}
        <span data-ev-id="ev_899f086d8b" className="text-slate-500">/{max}</span>
      </span>
    </div>);

}

function getBuildingEmoji(type: string): string {
  switch (type) {
    case 'city':return '🏙️';
    case 'university':return '🎓';
    case 'factory':return '🏭';
    case 'base':return '🏰';
    default:return '';
  }
}

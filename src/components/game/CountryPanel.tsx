// Country Info Panel - Shows selected country details and actions (RIGHT SIDE)
import { useState, useEffect } from 'react';
import type { GameState, Country, Player, PlannedAction, BuildAction, MoveAction, AttackAction } from '@/types/game';
import { BUILDING_COSTS, BUILDING_LIMITS } from '@/types/game';
import { canBuild, getAttackableCountries, getPlayerCountries, getPlayerTotalResources } from '@/utils/gameUtils';

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
  const [attackTarget, setAttackTarget] = useState<string>('');

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

  // Default army amounts to max available
  const [moveAmount, setMoveAmount] = useState<number>(availableArmy);
  const [attackAmount, setAttackAmount] = useState<number>(availableArmy);

  // Update amounts when available army changes
  useEffect(() => {
    setMoveAmount(availableArmy);
    setAttackAmount(availableArmy);
  }, [availableArmy]);

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
    onBuild(type);
  };

  const handleMove = () => {
    if (moveTarget && moveAmount > 0) {
      if (onMove(moveTarget, moveAmount)) {
        setMoveAmount(0);
      }
    }
  };

  const handleAttack = () => {
    if (attackTarget && attackAmount >= 100) {
      if (onAttack(attackTarget, attackAmount)) {
        setAttackAmount(0);
      }
    }
  };

  return (
    <div data-ev-id="ev_30e9b7c2f3" className="absolute bottom-4 right-4 z-20 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div data-ev-id="ev_224b3f866f" className="flex items-center justify-between p-4 border-b border-slate-700">
        <div data-ev-id="ev_1d9f5839f0" className="flex items-center gap-3">
          <div data-ev-id="ev_8b737f5c80"
          className="w-6 h-6 rounded-lg"
          style={{ backgroundColor: owner?.color || '#6B7280' }} />

          <div data-ev-id="ev_36b2ccbabb">
            <h3 data-ev-id="ev_5f4fd45851" className="text-white font-bold">{owner?.name || 'Neutral'}</h3>
            <p data-ev-id="ev_1aa55b16db" className="text-slate-400 text-xs">({country.coord.q}, {country.coord.r})</p>
          </div>
        </div>
        <button data-ev-id="ev_a6f2b15ffd"
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1">

          ✕
        </button>
      </div>
      
      {/* Tabs */}
      {isOwned &&
      <div data-ev-id="ev_8ca5c91890" className="flex border-b border-slate-700">
          {(['info', 'build', 'move', 'attack'] as const).map((tab) =>
        <button data-ev-id="ev_7f97e4eb15"
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
      <div data-ev-id="ev_90d02d674b" className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'info' &&
        <div data-ev-id="ev_ba9c856793" className="flex flex-col gap-4">
            {/* Resources */}
            <div data-ev-id="ev_87b5b35d7b">
              <h4 data-ev-id="ev_3e0a6c4e1f" className="text-slate-400 text-xs font-semibold mb-2">RESOURCES</h4>
              <div data-ev-id="ev_d8720be898" className="grid grid-cols-2 gap-2">
                <ResourceRow icon="💰" label="Money" value={country.resources.money} />
                <ResourceRow icon="🎓" label="Education" value={country.resources.education} />
                <ResourceRow icon="🔬" label="Technology" value={country.resources.technology} />
                <ResourceRow icon="⚔️" label="Army" value={availableArmy} highlight={availableArmy !== country.resources.army} />
              </div>
            </div>
            
            {/* Buildings */}
            <div data-ev-id="ev_29730fc694">
              <h4 data-ev-id="ev_da86305009" className="text-slate-400 text-xs font-semibold mb-2">BUILDINGS</h4>
              <div data-ev-id="ev_91ede5f224" className="grid grid-cols-2 gap-2">
                <BuildingRow icon="🏙️" label="Cities" value={effectiveBuildings.cities} max={4} pending={pendingBuilds.city} />
                <BuildingRow icon="🎓" label="Universities" value={effectiveBuildings.universities} max={2} pending={pendingBuilds.university} />
                <BuildingRow icon="🏭" label="Factories" value={effectiveBuildings.factories} max={8} pending={pendingBuilds.factory} />
                <BuildingRow icon="🏰" label="Bases" value={effectiveBuildings.bases} max={1} pending={pendingBuilds.base} />
              </div>
            </div>
          </div>
        }
        
        {activeTab === 'build' && isOwned &&
        <div data-ev-id="ev_a0869f1d5e" className="flex flex-col gap-3">
            {(['city', 'university', 'factory', 'base'] as const).map((type) => {
            const tempCountry = { ...country, buildings: effectiveBuildings };
            const check = canBuild(tempCountry, type, resources);
            const cost = BUILDING_COSTS[type];
            const limit = BUILDING_LIMITS[type];
            const current = effectiveBuildings[type === 'city' ? 'cities' : type === 'university' ? 'universities' : type === 'factory' ? 'factories' : 'bases'];

            return (
              <div data-ev-id="ev_fc1bffb771" key={type} className="bg-slate-700/50 rounded-lg p-3">
                  <div data-ev-id="ev_045c5bb345" className="flex items-center justify-between mb-2">
                    <span data-ev-id="ev_7d02f0f14e" className="text-white font-semibold capitalize">
                      {getBuildingEmoji(type)} {type}
                    </span>
                    <span data-ev-id="ev_acf24f92c0" className="text-slate-400 text-xs">{current}/{limit}</span>
                  </div>
                  <div data-ev-id="ev_e7992c0ef2" className="text-xs text-slate-400 mb-2">
                    Cost: {cost.money > 0 && `💰${cost.money.toLocaleString()}`}
                    {cost.education > 0 && ` 🎓${cost.education.toLocaleString()}`}
                    {cost.technology > 0 && ` 🔬${cost.technology.toLocaleString()}`}
                  </div>
                  <button data-ev-id="ev_935a986421"
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
        <div data-ev-id="ev_c2629179a5" className="flex flex-col gap-4">
            <div data-ev-id="ev_a217e842f5" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_1d36805b10" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
            </div>
            
            {playerCountries.length > 0 ?
          <>
                <div data-ev-id="ev_309d9ced70">
                  <label data-ev-id="ev_1dd09e1fe6" className="block text-slate-400 text-xs mb-1">Destination</label>
                  <select data-ev-id="ev_2bb972a115"
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_4742458d2d" value="">Select country...</option>
                    {playerCountries.map((c) =>
                <option data-ev-id="ev_ea7d380329" key={c.id} value={c.id}>
                        ({c.coord.q}, {c.coord.r}) - {c.resources.army.toLocaleString()} army
                      </option>
                )}
                  </select>
                </div>
                
                <div data-ev-id="ev_7afc1e16aa">
                  <label data-ev-id="ev_ebdb4d7f71" className="block text-slate-400 text-xs mb-1">Amount</label>
                  <input data-ev-id="ev_488327de6b"
              type="number"
              min={0}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(Math.min(parseInt(e.target.value) || 0, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_19f7cb9795"
              type="range"
              min={0}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-amber-500" />

                </div>
                
                <button data-ev-id="ev_06cac9fd85"
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

          <p data-ev-id="ev_7aadb68bc0" className="text-slate-500 text-sm">No other countries to move to.</p>
          }
          </div>
        }
        
        {activeTab === 'attack' && isOwned &&
        <div data-ev-id="ev_41107d13cd" className="flex flex-col gap-4">
            <div data-ev-id="ev_37e6ede8fb" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_45c569e157" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
              {availableArmy < 100 && <span data-ev-id="ev_1be14045da" className="text-red-400 ml-2">(Min 100 to attack)</span>}
            </div>
            
            {attackableCountries.length > 0 ?
          <>
                <div data-ev-id="ev_68463a21db">
                  <label data-ev-id="ev_62b08b6f53" className="block text-slate-400 text-xs mb-1">Target</label>
                  <select data-ev-id="ev_2bf369d683"
              value={attackTarget}
              onChange={(e) => setAttackTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_bc138ce629" value="">Select target...</option>
                    {attackableCountries.map((c) => {
                  const targetOwner = c.ownerId ? gameState.players[c.ownerId] : null;
                  return (
                    <option data-ev-id="ev_f940722c75" key={c.id} value={c.id}>
                          {targetOwner?.name || 'Neutral'} - ⚔️{c.resources.army.toLocaleString()}
                        </option>);

                })}
                  </select>
                </div>
                
                <div data-ev-id="ev_983a0df0a7">
                  <label data-ev-id="ev_42cca81fc4" className="block text-slate-400 text-xs mb-1">Attack Force</label>
                  <input data-ev-id="ev_adffcbf450"
              type="number"
              min={100}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(Math.min(parseInt(e.target.value) || 0, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_657d264643"
              type="range"
              min={Math.min(100, availableArmy)}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-red-500" />

                </div>
                
                {attackTarget &&
            <div data-ev-id="ev_36b071edd9" className="bg-slate-700/50 rounded-lg p-3">
                    <div data-ev-id="ev_9fa7770a1e" className="text-xs text-slate-400 mb-1">Battle Prediction</div>
                    <div data-ev-id="ev_9382483885" className="text-sm">
                      {(() => {
                  const target = gameState.countries[attackTarget];
                  if (!target) return null;
                  const defenderArmy = target.resources.army;
                  if (attackAmount > defenderArmy) {
                    return <span data-ev-id="ev_5793b3f27a" className="text-green-400">WIN - {(attackAmount - defenderArmy).toLocaleString()} army survives</span>;
                  } else if (attackAmount === defenderArmy) {
                    return <span data-ev-id="ev_de0a6aedd7" className="text-yellow-400">TIE - Defender wins, both armies lost</span>;
                  } else {
                    return <span data-ev-id="ev_878ca7fb83" className="text-red-400">LOSE - Need more than {defenderArmy.toLocaleString()}</span>;
                  }
                })()}
                    </div>
                  </div>
            }
                
                <button data-ev-id="ev_cdaa4860c2"
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

          <p data-ev-id="ev_ac976a5578" className="text-slate-500 text-sm">
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
    <div data-ev-id="ev_b3a9b82981" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_4678b6f8f7">{icon}</span>
      <span data-ev-id="ev_e68fef0d94" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_b3d3823e28" className={`ml-auto font-bold text-sm ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </span>
    </div>);

}

function BuildingRow({ icon, label, value, max, pending }: {icon: string;label: string;value: number;max: number;pending: number;}) {
  return (
    <div data-ev-id="ev_cec59c87c1" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_0c4ae73b74">{icon}</span>
      <span data-ev-id="ev_e8119c404f" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_c87cca8786" className="ml-auto font-bold text-sm text-white">
        {value - pending}
        {pending > 0 && <span data-ev-id="ev_82564baaaa" className="text-amber-400">+{pending}</span>}
        <span data-ev-id="ev_d97f714f7b" className="text-slate-500">/{max}</span>
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

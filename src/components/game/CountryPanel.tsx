// Country Info Panel - Shows selected country details and actions (RIGHT SIDE)
import { useState, useEffect } from 'react';
import type { GameState, Country, Player, PlannedAction, BuildAction, MoveAction, AttackAction, UpgradeBaseAction } from '@/types/game';
import { BUILDING_COSTS, BUILDING_LIMITS, BASE_UPGRADE_COSTS, BASE_UPGRADE_BONUSES } from '@/types/game';
import { canBuild, canUpgradeBase, getAttackableCountries, getPlayerCountries, getPlayerTotalResources } from '@/utils/gameUtils';

interface CountryPanelProps {
  country: Country;
  owner: Player | null;
  currentPlayer: Player;
  gameState: GameState;
  pendingActions: PlannedAction[];
  onBuild: (buildingType: 'city' | 'university' | 'factory' | 'base') => boolean;
  onUpgradeBase: () => boolean;
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
  onUpgradeBase,
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
    } else if (action.type === 'upgrade_base' && action.playerId === currentPlayer.id) {
      const upgradeData = action.data as UpgradeBaseAction;
      const targetCountry = gameState.countries[upgradeData.countryId];
      if (targetCountry) {
        const pendingUpgrades = pendingActions.filter(
          (a) => a.type === 'upgrade_base' && (a.data as UpgradeBaseAction).countryId === upgradeData.countryId
        ).length;
        const level = targetCountry.buildings.baseUpgrades + pendingUpgrades - 1;
        if (level >= 0 && level < BASE_UPGRADE_COSTS.length) {
          const cost = BASE_UPGRADE_COSTS[level];
          resources.money -= cost.money;
          resources.education -= cost.education;
          resources.technology -= cost.technology;
        }
      }
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
  let pendingUpgradeCount = 0;
  pendingActions.forEach((action) => {
    if (action.type === 'build') {
      const data = action.data as BuildAction;
      if (data.countryId === country.id) {
        pendingBuilds[data.buildingType]++;
      }
    } else if (action.type === 'upgrade_base') {
      const data = action.data as UpgradeBaseAction;
      if (data.countryId === country.id) {
        pendingUpgradeCount++;
      }
    }
  });

  const effectiveBuildings = {
    cities: country.buildings.cities + pendingBuilds.city,
    universities: country.buildings.universities + pendingBuilds.university,
    factories: country.buildings.factories + pendingBuilds.factory,
    bases: country.buildings.bases + pendingBuilds.base,
    baseUpgrades: country.buildings.baseUpgrades + pendingUpgradeCount
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
    <div data-ev-id="ev_6f26293552" className="absolute bottom-4 right-4 z-20 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div data-ev-id="ev_6be615cc4b" className="flex items-center justify-between p-4 border-b border-slate-700">
        <div data-ev-id="ev_7e16791477" className="flex items-center gap-3">
          <div data-ev-id="ev_171224c01f"
          className="w-6 h-6 rounded-lg"
          style={{ backgroundColor: owner?.color || '#6B7280' }} />

          <div data-ev-id="ev_8098832c1f">
            <h3 data-ev-id="ev_ca05a751c5" className="text-white font-bold">{owner?.name || 'Neutral'}</h3>
            <p data-ev-id="ev_123293d44c" className="text-slate-400 text-xs">({country.coord.q}, {country.coord.r})</p>
          </div>
        </div>
        <button data-ev-id="ev_2e204e5e4d"
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1">

          ✕
        </button>
      </div>
      
      {/* Tabs */}
      {isOwned &&
      <div data-ev-id="ev_f16d96019e" className="flex border-b border-slate-700">
          {(['info', 'build', 'move', 'attack'] as const).map((tab) =>
        <button data-ev-id="ev_90cdad2468"
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
      <div data-ev-id="ev_1f8e5bc829" className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'info' &&
        <div data-ev-id="ev_f8445885ae" className="flex flex-col gap-4">
            {/* Resources */}
            <div data-ev-id="ev_c2918a0951">
              <h4 data-ev-id="ev_51d873068b" className="text-slate-400 text-xs font-semibold mb-2">RESOURCES</h4>
              <div data-ev-id="ev_995812beda" className="grid grid-cols-2 gap-2">
                <ResourceRow icon="💰" label="Money" value={country.resources.money} />
                <ResourceRow icon="🎓" label="Education" value={country.resources.education} />
                <ResourceRow icon="🔬" label="Technology" value={country.resources.technology} />
                <ResourceRow icon="⚔️" label="Army" value={availableArmy} highlight={availableArmy !== country.resources.army} />
              </div>
            </div>
            
            {/* Buildings */}
            <div data-ev-id="ev_c78713bd10">
              <h4 data-ev-id="ev_e7feb0336e" className="text-slate-400 text-xs font-semibold mb-2">BUILDINGS</h4>
              <div data-ev-id="ev_c0239ef1cb" className="grid grid-cols-2 gap-2">
                <BuildingRow icon="🏙️" label="Cities" value={effectiveBuildings.cities} max={4} pending={pendingBuilds.city} />
                <BuildingRow icon="🎓" label="Universities" value={effectiveBuildings.universities} max={2} pending={pendingBuilds.university} />
                <BuildingRow icon="🏭" label="Factories" value={effectiveBuildings.factories} max={8} pending={pendingBuilds.factory} />
                <BuildingRow icon="🏰" label="Bases" value={effectiveBuildings.bases} max={1} pending={pendingBuilds.base} upgrade={effectiveBuildings.baseUpgrades} pendingUpgrade={pendingUpgradeCount} />
              </div>
            </div>
          </div>
        }
        
        {activeTab === 'build' && isOwned &&
        <div data-ev-id="ev_3b3e9a0bb0" className="flex flex-col gap-3">
            {(['city', 'university', 'factory', 'base'] as const).map((type) => {
            const tempCountry = { ...country, buildings: effectiveBuildings };
            const check = canBuild(tempCountry, type, resources);
            const cost = BUILDING_COSTS[type];
            const limit = BUILDING_LIMITS[type];
            const current = effectiveBuildings[type === 'city' ? 'cities' : type === 'university' ? 'universities' : type === 'factory' ? 'factories' : 'bases'];

            return (
              <div data-ev-id="ev_01f229715c" key={type} className="bg-slate-700/50 rounded-lg p-3">
                  <div data-ev-id="ev_eb774e5a27" className="flex items-center justify-between mb-2">
                    <span data-ev-id="ev_8dc6f25ad3" className="text-white font-semibold capitalize">
                      {getBuildingEmoji(type)} {type}
                    </span>
                    <span data-ev-id="ev_fd8acd19c7" className="text-slate-400 text-xs">{current}/{limit}</span>
                  </div>
                  <div data-ev-id="ev_4c916f3c69" className="text-xs text-slate-400 mb-2">
                    Cost: {cost.money > 0 && `💰${cost.money.toLocaleString()}`}
                    {cost.education > 0 && ` 🎓${cost.education.toLocaleString()}`}
                    {cost.technology > 0 && ` 🔬${cost.technology.toLocaleString()}`}
                  </div>
                  <button data-ev-id="ev_176b2b8642"
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
            
            {/* Base Upgrade Section */}
            {effectiveBuildings.bases >= 1 &&
          <div data-ev-id="ev_4ee38b6ecb" className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                <div data-ev-id="ev_6d7eba893b" className="flex items-center justify-between mb-2">
                  <span data-ev-id="ev_b740c1a45a" className="text-white font-semibold">
                    ⬆️ Base Upgrade
                  </span>
                  <span data-ev-id="ev_9277283b1a" className="text-slate-400 text-xs">Level {effectiveBuildings.baseUpgrades}/2</span>
                </div>
                {effectiveBuildings.baseUpgrades < 2 ?
            <>
                    <div data-ev-id="ev_4c4ff926d6" className="text-xs text-slate-400 mb-1">
                      Cost: 💰{BASE_UPGRADE_COSTS[effectiveBuildings.baseUpgrades].money.toLocaleString()}
                      {' '}🎓{BASE_UPGRADE_COSTS[effectiveBuildings.baseUpgrades].education.toLocaleString()}
                      {' '}🔬{BASE_UPGRADE_COSTS[effectiveBuildings.baseUpgrades].technology.toLocaleString()}
                    </div>
                    <div data-ev-id="ev_1895cb8d7b" className="text-xs text-green-400 mb-2">
                      Bonus: +{BASE_UPGRADE_BONUSES[effectiveBuildings.baseUpgrades]} army/turn
                    </div>
                    {(() => {
                const tempCountry = { ...country, buildings: effectiveBuildings };
                const check = canUpgradeBase(tempCountry, resources);
                return (
                  <button data-ev-id="ev_8f4b8e71b3"
                  onClick={() => onUpgradeBase()}
                  disabled={!check.canUpgrade}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                  check.canUpgrade ?
                  'bg-purple-500 hover:bg-purple-400 text-white' :
                  'bg-slate-600 text-slate-400 cursor-not-allowed'}`
                  }>

                          {check.canUpgrade ? 'Upgrade' : check.reason}
                        </button>);

              })()}
                  </> :

            <div data-ev-id="ev_a3ba58330c" className="text-xs text-green-400">Fully upgraded! (+750 army/turn total)</div>
            }
              </div>
          }
          </div>
        }
        
        {activeTab === 'move' && isOwned &&
        <div data-ev-id="ev_53efe43a1f" className="flex flex-col gap-4">
            <div data-ev-id="ev_454dc82f72" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_f17899b854" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
            </div>
            
            {playerCountries.length > 0 ?
          <>
                <div data-ev-id="ev_9010ad2bd0">
                  <label data-ev-id="ev_497e0efd7f" className="block text-slate-400 text-xs mb-1">Destination</label>
                  <select data-ev-id="ev_94aa405d67"
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_7948232cfc" value="">Select country...</option>
                    {playerCountries.map((c) =>
                <option data-ev-id="ev_e9601fd3b7" key={c.id} value={c.id}>
                        ({c.coord.q}, {c.coord.r}) - {c.resources.army.toLocaleString()} army
                      </option>
                )}
                  </select>
                </div>
                
                <div data-ev-id="ev_da973f9eb9">
                  <label data-ev-id="ev_98d386346e" className="block text-slate-400 text-xs mb-1">Amount</label>
                  <input data-ev-id="ev_7f14018db7"
              type="number"
              min={0}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(Math.min(parseInt(e.target.value) || 0, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_880f86c232"
              type="range"
              min={0}
              max={availableArmy}
              value={moveAmount}
              onChange={(e) => setMoveAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-amber-500" />

                </div>
                
                <button data-ev-id="ev_743168cd9b"
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

          <p data-ev-id="ev_8bac2eeece" className="text-slate-500 text-sm">No other countries to move to.</p>
          }
          </div>
        }
        
        {activeTab === 'attack' && isOwned &&
        <div data-ev-id="ev_e959b2796e" className="flex flex-col gap-4">
            <div data-ev-id="ev_86ec60f779" className="text-slate-400 text-sm">
              Available Army: <span data-ev-id="ev_1d7d55694e" className="text-white font-bold">{availableArmy.toLocaleString()}</span>
              {availableArmy < 100 && <span data-ev-id="ev_7a97e30bc4" className="text-red-400 ml-2">(Min 100 to attack)</span>}
            </div>
            
            {attackableCountries.length > 0 ?
          <>
                <div data-ev-id="ev_948c2c0812">
                  <label data-ev-id="ev_bfe277e922" className="block text-slate-400 text-xs mb-1">Target</label>
                  <select data-ev-id="ev_46410424bc"
              value={attackTarget}
              onChange={(e) => setAttackTarget(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">

                    <option data-ev-id="ev_3d4565eb9f" value="">Select target...</option>
                    {attackableCountries.map((c) => {
                  const targetOwner = c.ownerId ? gameState.players[c.ownerId] : null;
                  return (
                    <option data-ev-id="ev_a8d792dc80" key={c.id} value={c.id}>
                          ({c.coord.q}, {c.coord.r}) {targetOwner?.name || 'Neutral'} - ⚔️{c.resources.army.toLocaleString()}
                        </option>);

                })}
                  </select>
                </div>
                
                <div data-ev-id="ev_4e1ee72abd">
                  <label data-ev-id="ev_780de8bc9c" className="block text-slate-400 text-xs mb-1">Attack Force</label>
                  <input data-ev-id="ev_79aa923430"
              type="number"
              min={100}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(Math.min(parseInt(e.target.value) || 0, availableArmy))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />

                  <input data-ev-id="ev_029ad95663"
              type="range"
              min={Math.min(100, availableArmy)}
              max={availableArmy}
              value={attackAmount}
              onChange={(e) => setAttackAmount(parseInt(e.target.value))}
              className="w-full mt-2 accent-red-500" />

                </div>
                
                {attackTarget &&
            <div data-ev-id="ev_166b95653d" className="bg-slate-700/50 rounded-lg p-3">
                    <div data-ev-id="ev_df9eeaeb98" className="text-xs text-slate-400 mb-1">Battle Prediction</div>
                    <div data-ev-id="ev_c868735dc6" className="text-sm">
                      {(() => {
                  const target = gameState.countries[attackTarget];
                  if (!target) return null;
                  const defenderArmy = target.resources.army;
                  if (attackAmount > defenderArmy) {
                    return <span data-ev-id="ev_343954afce" className="text-green-400">WIN - {(attackAmount - defenderArmy).toLocaleString()} army survives</span>;
                  } else if (attackAmount === defenderArmy) {
                    return <span data-ev-id="ev_1149253460" className="text-yellow-400">TIE - Defender wins, both armies lost</span>;
                  } else {
                    return <span data-ev-id="ev_f901b8dedf" className="text-red-400">LOSE - Need more than {defenderArmy.toLocaleString()}</span>;
                  }
                })()}
                    </div>
                  </div>
            }
                
                <button data-ev-id="ev_9fda88acab"
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

          <p data-ev-id="ev_e2c4203ba2" className="text-slate-500 text-sm">
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
    <div data-ev-id="ev_64fb20075b" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_d10de4bd31">{icon}</span>
      <span data-ev-id="ev_7a9f1007e4" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_7b5486d60c" className={`ml-auto font-bold text-sm ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </span>
    </div>);

}

function BuildingRow({ icon, label, value, max, pending, upgrade, pendingUpgrade }: {icon: string;label: string;value: number;max: number;pending: number;upgrade?: number;pendingUpgrade?: number;}) {
  return (
    <div data-ev-id="ev_50456d727c" className="flex items-center gap-2 bg-slate-700/50 rounded px-2 py-1">
      <span data-ev-id="ev_c636351a15">{icon}</span>
      <span data-ev-id="ev_c12162c82d" className="text-slate-400 text-xs">{label}</span>
      <span data-ev-id="ev_14e7b754c2" className="ml-auto font-bold text-sm text-white">
        {value - pending}
        {pending > 0 && <span data-ev-id="ev_d491ef3757" className="text-amber-400">+{pending}</span>}
        <span data-ev-id="ev_2e138062b3" className="text-slate-500">/{max}</span>
        {upgrade !== undefined && upgrade > 0 &&
        <span data-ev-id="ev_67a4b2a97e" className="text-purple-400 ml-1">★{upgrade - (pendingUpgrade || 0)}{pendingUpgrade && pendingUpgrade > 0 ? <span data-ev-id="ev_76f9a48d3c" className="text-amber-400">+{pendingUpgrade}</span> : ''}</span>
        }
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

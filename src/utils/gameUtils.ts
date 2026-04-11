// Game Logic Utilities
import type {
  GameState,
  Country,
  Player,
  Resources,
  PlannedAction,
  CombatLogEntry,
  GameConfig,
} from '@/types/game';
import { BUILDING_COSTS, BUILDING_LIMITS, PLAYER_COLORS, NEUTRAL_COLOR, BUILDING_UPKEEP, BASE_UPGRADE_COSTS, BASE_UPGRADE_BONUSES } from '@/types/game';
import { generateMapCoords, coordToId, getNeighbors, areNeighbors } from '@/utils/hexUtils';

// Calculate income from buildings (production per turn)
export function calculateIncome(country: Country, player: Player, allCountries: Country[]): Resources {
  const { cities, universities, factories, bases, baseUpgrades } = country.buildings;
  const income: Resources = { money: 0, education: 0, technology: 0, army: 0 };

  // City income: 1000 per city + cumulative bonuses
  for (let i = 1; i <= cities; i++) {
    income.money += 1000;
  }
  if (cities >= 2) income.money += 250;
  if (cities >= 3) income.money += 250;
  if (cities >= 4) income.money += 500;

  // University income: 500 education per uni + bonuses
  for (let i = 1; i <= universities; i++) {
    income.education += 500;
  }
  if (universities >= 1) income.money += 250;
  if (universities >= 2) {
    income.money += 250;
    income.education += 250;
  }

  // Factory income: 250 tech + 250 money per factory + cumulative tech bonuses
  for (let i = 1; i <= factories; i++) {
    income.technology += 250;
    income.money += 250;
  }
  if (factories >= 2) income.technology += 50;
  if (factories >= 4) income.technology += 50;
  if (factories >= 6) income.technology += 100;
  if (factories >= 8) income.technology += 200;

  // Base income: 1000 army + global and local bonuses
  if (bases >= 1) {
    income.army += 1000;
    
    // Base upgrade bonuses
    for (let i = 0; i < baseUpgrades; i++) {
      income.army += BASE_UPGRADE_BONUSES[i];
    }
    
    // Global bonuses only for non-neutral players
    if (!player.isNeutral) {
      const playerCountries = Object.values(allCountries).filter(c => c.ownerId === player.id);
      const additionalCountries = playerCountries.length - 1;
      const totalBases = playerCountries.reduce((sum, c) => sum + c.buildings.bases, 0);
      const additionalBases = totalBases - 1;
      
      income.army += additionalCountries * 100;
      income.army += additionalBases * 150;
    }
    
    // Local bonus: +250 if THIS country has 1 base, 2 universities and 8 factories
    if (bases >= 1 && universities >= 2 && factories >= 8) {
      income.army += 250;
    }
  }

  return income;
}

// Calculate upkeep costs for a country
export function calculateUpkeep(country: Country): { money: number; technology: number } {
  const { universities, factories, bases } = country.buildings;
  let money = 0;
  let technology = 0;
  
  money += universities * BUILDING_UPKEEP.university.money;
  money += factories * BUILDING_UPKEEP.factory.money;
  money += bases * BUILDING_UPKEEP.base.money;
  technology += bases * BUILDING_UPKEEP.base.technology;
  
  return { money, technology };
}

// Calculate total upkeep for a player
export function getPlayerTotalUpkeep(playerId: string, countries: Record<string, Country>): { money: number; technology: number } {
  const total = { money: 0, technology: 0 };
  Object.values(countries).forEach((country) => {
    if (country.ownerId === playerId) {
      const upkeep = calculateUpkeep(country);
      total.money += upkeep.money;
      total.technology += upkeep.technology;
    }
  });
  return total;
}

// Calculate total production for a player
export function getPlayerTotalProduction(playerId: string, countries: Record<string, Country>, players: Record<string, Player>): Resources {
  const total: Resources = { money: 0, education: 0, technology: 0, army: 0 };
  const player = players[playerId];
  if (!player) return total;
  
  const allCountries = Object.values(countries);
  allCountries.forEach((country) => {
    if (country.ownerId === playerId) {
      const income = calculateIncome(country, player, allCountries);
      total.money += income.money;
      total.education += income.education;
      total.technology += income.technology;
      total.army += income.army;
    }
  });
  
  // Subtract upkeep from money and technology production
  const upkeep = getPlayerTotalUpkeep(playerId, countries);
  total.money -= upkeep.money;
  total.technology -= upkeep.technology;
  
  return total;
}

// Check if a building can be built
export function canBuild(
  country: Country,
  buildingType: 'city' | 'university' | 'factory' | 'base',
  playerResources: Resources
): { canBuild: boolean; reason?: string } {
  const cost = BUILDING_COSTS[buildingType];
  const limit = BUILDING_LIMITS[buildingType];
  const current = country.buildings[buildingType === 'city' ? 'cities' : 
                  buildingType === 'university' ? 'universities' :
                  buildingType === 'factory' ? 'factories' : 'bases'];

  if (current >= limit) {
    return { canBuild: false, reason: `Maximum ${limit} ${buildingType}(s) per country` };
  }

  if (playerResources.money < cost.money) {
    return { canBuild: false, reason: `Need ${cost.money} money` };
  }
  if (playerResources.education < cost.education) {
    return { canBuild: false, reason: `Need ${cost.education} education` };
  }
  if (playerResources.technology < cost.technology) {
    return { canBuild: false, reason: `Need ${cost.technology} technology` };
  }

  if (buildingType === 'university') {
    const requiredCities = (country.buildings.universities + 1) * 2;
    if (country.buildings.cities < requiredCities) {
      return { canBuild: false, reason: `Need ${requiredCities} cities for ${country.buildings.universities + 1} universities` };
    }
  }

  if (buildingType === 'factory') {
    const requiredCities = Math.ceil((country.buildings.factories + 1) / 2);
    if (country.buildings.cities < requiredCities) {
      return { canBuild: false, reason: `Need ${requiredCities} cities for ${country.buildings.factories + 1} factories` };
    }
  }

  return { canBuild: true };
}

// Check if a base can be upgraded
export function canUpgradeBase(
  country: Country,
  playerResources: Resources
): { canUpgrade: boolean; reason?: string } {
  if (country.buildings.bases < 1) {
    return { canUpgrade: false, reason: 'No base to upgrade' };
  }
  
  if (country.buildings.baseUpgrades >= 2) {
    return { canUpgrade: false, reason: 'Base already fully upgraded' };
  }
  
  const upgradeLevel = country.buildings.baseUpgrades;
  const cost = BASE_UPGRADE_COSTS[upgradeLevel];
  
  if (playerResources.money < cost.money) {
    return { canUpgrade: false, reason: `Need ${cost.money} money` };
  }
  if (playerResources.education < cost.education) {
    return { canUpgrade: false, reason: `Need ${cost.education} education` };
  }
  if (playerResources.technology < cost.technology) {
    return { canUpgrade: false, reason: `Need ${cost.technology} technology` };
  }
  
  return { canUpgrade: true };
}

// Resolve combat between attacker and defender
export function resolveCombat(
  attackerArmy: number,
  defenderArmy: number
): { result: 'attacker_wins' | 'defender_wins' | 'tie'; remainingArmy: number } {
  if (attackerArmy > defenderArmy) {
    return { result: 'attacker_wins', remainingArmy: attackerArmy - defenderArmy };
  } else if (attackerArmy === defenderArmy) {
    return { result: 'tie', remainingArmy: 0 };
  } else {
    return { result: 'defender_wins', remainingArmy: defenderArmy - attackerArmy };
  }
}

// Get total resources for a player across all their countries
export function getPlayerTotalResources(playerId: string, countries: Record<string, Country>): Resources {
  const total: Resources = { money: 0, education: 0, technology: 0, army: 0 };
  Object.values(countries).forEach((country) => {
    if (country.ownerId === playerId) {
      total.money += country.resources.money;
      total.education += country.resources.education;
      total.technology += country.resources.technology;
      total.army += country.resources.army;
    }
  });
  return total;
}

// Initialize a new game
export function initializeGame(config: GameConfig): GameState {
  const { mapWidth, mapHeight, playerCount, aiCount, playerNames, playerColors, initialAlliances } = config;
  
  const coords = generateMapCoords(mapWidth, mapHeight);
  
  const players: Record<string, Player> = {};
  const turnOrder: string[] = [];
  
  const totalPlayers = playerCount + aiCount;
  
  for (let i = 0; i < totalPlayers; i++) {
    const id = `player_${i}`;
    players[id] = {
      id,
      name: playerNames[i] || `Player ${i + 1}`,
      color: playerColors[i] || PLAYER_COLORS[i % PLAYER_COLORS.length],
      isAI: i >= playerCount,
      isNeutral: false,
      isEliminated: false,
      allies: [],
      pendingAllianceRequests: [],
      outgoingAllianceRequests: [],
    };
    turnOrder.push(id);
  }
  
  // Apply initial alliances if any
  if (initialAlliances) {
    initialAlliances.forEach(([idx1, idx2]) => {
      const id1 = `player_${idx1}`;
      const id2 = `player_${idx2}`;
      if (players[id1] && players[id2]) {
        if (!players[id1].allies.includes(id2)) {
          players[id1].allies.push(id2);
        }
        if (!players[id2].allies.includes(id1)) {
          players[id2].allies.push(id1);
        }
      }
    });
  }
  
  const neutralId = 'neutral';
  players[neutralId] = {
    id: neutralId,
    name: 'Neutral',
    color: NEUTRAL_COLOR,
    isAI: true,
    isNeutral: true,
    isEliminated: false,
    allies: [],
    pendingAllianceRequests: [],
    outgoingAllianceRequests: [],
  };
  
  const countries: Record<string, Country> = {};
  coords.forEach((coord) => {
    const id = coordToId(coord);
    countries[id] = {
      id,
      coord,
      ownerId: null,
      resources: { money: 0, education: 0, technology: 0, army: 0 },
      buildings: { cities: 0, universities: 0, factories: 0, bases: 0, baseUpgrades: 0 },
      naturalResources: Math.random() > 0.5,
    };
  });
  
  const startingPositions = getStartingPositions(coords, totalPlayers);
  startingPositions.forEach((coord, i) => {
    const countryId = coordToId(coord);
    const playerId = turnOrder[i];
    countries[countryId].ownerId = playerId;
    // Starting resources
    countries[countryId].resources = { money: 10000, education: 0, technology: 0, army: 0 };
    // Starting buildings
    countries[countryId].buildings = { cities: 1, universities: 0, factories: 0, bases: 0, baseUpgrades: 0 };
  });
  
  // Assign remaining countries to neutral
  Object.values(countries).forEach((country) => {
    if (country.ownerId === null) {
      country.ownerId = neutralId;
      // Neutral countries start with some resources if they have natural resources
      if (country.naturalResources) {
        country.resources = { money: 5000, education: 0, technology: 0, army: 500 };
        country.buildings = { cities: 1, universities: 0, factories: 0, bases: 0, baseUpgrades: 0 };
      } else {
        country.resources = { money: 2000, education: 0, technology: 0, army: 200 };
        country.buildings = { cities: 0, universities: 0, factories: 0, bases: 0, baseUpgrades: 0 };
      }
    }
  });
  
  return {
    phase: 'planning',
    round: 1,
    currentPlayerIndex: 0,
    turnDirection: 1,
    turnOrder,
    players,
    countries,
    mapSize: { width: mapWidth, height: mapHeight },
    plannedActions: [],
    combatLog: [],
    winner: null,
  };
}

// Get evenly distributed starting positions
function getStartingPositions(coords: { q: number; r: number }[], playerCount: number): { q: number; r: number }[] {
  if (coords.length < playerCount) {
    return coords.slice(0, playerCount);
  }
  
  // Find center
  const centerQ = coords.reduce((sum, c) => sum + c.q, 0) / coords.length;
  const centerR = coords.reduce((sum, c) => sum + c.r, 0) / coords.length;
  
  // Sort by distance from center, then take evenly spaced positions
  const sorted = [...coords].sort((a, b) => {
    const distA = Math.abs(a.q - centerQ) + Math.abs(a.r - centerR);
    const distB = Math.abs(b.q - centerQ) + Math.abs(b.r - centerR);
    return distB - distA; // Furthest from center first
  });
  
  // Take positions spread around the map
  const positions: { q: number; r: number }[] = [];
  const step = Math.floor(sorted.length / playerCount);
  
  for (let i = 0; i < playerCount; i++) {
    positions.push(sorted[i * step]);
  }
  
  return positions;
}

export function getPlayerCountries(playerId: string, countries: Record<string, Country>): Country[] {
  return Object.values(countries).filter((c) => c.ownerId === playerId);
}

export function canAttack(
  fromCountry: Country,
  toCountry: Country,
  attacker: Player,
  countries: Record<string, Country>
): { canAttack: boolean; reason?: string } {
  if (fromCountry.ownerId !== attacker.id) {
    return { canAttack: false, reason: 'Not your country' };
  }

  if (toCountry.ownerId === attacker.id) {
    return { canAttack: false, reason: 'Cannot attack own country' };
  }

  // Check if target owner is an ally
  if (toCountry.ownerId && attacker.allies.includes(toCountry.ownerId)) {
    return { canAttack: false, reason: 'Cannot attack ally' };
  }

  if (!areNeighbors(fromCountry.coord, toCountry.coord)) {
    return { canAttack: false, reason: 'Not adjacent' };
  }

  if (fromCountry.resources.army < 100) {
    return { canAttack: false, reason: 'Need at least 100 army' };
  }

  return { canAttack: true };
}

// Get all countries that can be attacked from a given country
export function getAttackableCountries(
  fromCountry: Country,
  countries: Record<string, Country>,
  attacker: Player
): Country[] {
  const neighbors = getNeighbors(fromCountry.coord);
  return neighbors
    .map((coord) => countries[coordToId(coord)])
    .filter((c): c is Country => {
      if (!c) return false;
      const check = canAttack(fromCountry, c, attacker, countries);
      return check.canAttack;
    });
}

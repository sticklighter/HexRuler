// Game Logic Utilities
import type {
  GameState,
  Country,
  Player,
  Resources,
  Buildings,
  PlannedAction,
  CombatLogEntry,
  GameConfig,
} from '@/types/game';
import { BUILDING_COSTS, BUILDING_LIMITS, PLAYER_COLORS, NEUTRAL_COLOR } from '@/types/game';
import { generateMapCoords, coordToId, getNeighbors, areNeighbors, idToCoord } from '@/utils/hexUtils';

// Calculate income from buildings
export function calculateIncome(country: Country, player: Player, allCountries: Country[]): Resources {
  const { cities, universities, factories, bases } = country.buildings;
  const income: Resources = { money: 0, education: 0, technology: 0, army: 0 };

  // City income: 1000 per city + cumulative bonuses
  // Bonuses: 2nd +250, 3rd +250 (total 500), 4th +500 (total 1000)
  for (let i = 1; i <= cities; i++) {
    income.money += 1000;
  }
  if (cities >= 2) income.money += 250;  // 2nd city bonus
  if (cities >= 3) income.money += 250;  // 3rd city bonus (cumulative: 500)
  if (cities >= 4) income.money += 500;  // 4th city bonus (cumulative: 1000)

  // University income: 500 education per uni + bonuses
  // 1st uni: +250 money, 2nd uni: +250 money (total 500) AND +250 education
  for (let i = 1; i <= universities; i++) {
    income.education += 500;
  }
  if (universities >= 1) income.money += 250;  // 1st uni bonus
  if (universities >= 2) {
    income.money += 250;      // 2nd uni money bonus (total 500)
    income.education += 250;  // 2nd uni education bonus
  }

  // Factory income: 250 tech + 250 money per factory + cumulative tech bonuses
  // Bonuses: 2nd +50, 4th +50 (sum 100), 6th +100 (sum 200), 8th +200 (sum 400)
  for (let i = 1; i <= factories; i++) {
    income.technology += 250;
    income.money += 250;
  }
  if (factories >= 2) income.technology += 50;   // 2nd factory bonus
  if (factories >= 4) income.technology += 50;   // 4th factory bonus (sum: 100)
  if (factories >= 6) income.technology += 100;  // 6th factory bonus (sum: 200)
  if (factories >= 8) income.technology += 200;  // 8th factory bonus (sum: 400)

  // Base income: 1000 army + global and local bonuses (max 1 base per country)
  if (bases >= 1) {
    income.army += 1000;
    
    // Global bonuses - count other countries and other bases
    const playerCountries = Object.values(allCountries).filter(c => c.ownerId === player.id);
    const additionalCountries = playerCountries.length - 1;
    const totalBases = playerCountries.reduce((sum, c) => sum + c.buildings.bases, 0);
    const additionalBases = totalBases - 1;
    
    income.army += additionalCountries * 100;  // +100 per additional country
    income.army += additionalBases * 150;      // +150 per additional base globally
    
    // Local bonus: +250 if THIS country has 1 base, 2 universities and 8 factories
    if (bases >= 1 && universities >= 2 && factories >= 8) {
      income.army += 250;
    }
  }

  return income;
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

  // Check limit
  if (current >= limit) {
    return { canBuild: false, reason: `Maximum ${limit} ${buildingType}(s) per country` };
  }

  // Check resources
  if (playerResources.money < cost.money) {
    return { canBuild: false, reason: `Need ${cost.money} money` };
  }
  if (playerResources.education < cost.education) {
    return { canBuild: false, reason: `Need ${cost.education} education` };
  }
  if (playerResources.technology < cost.technology) {
    return { canBuild: false, reason: `Need ${cost.technology} technology` };
  }

  // Check prerequisites
  if (buildingType === 'university') {
    // Requires at least 2 cities per university
    const requiredCities = (country.buildings.universities + 1) * 2;
    if (country.buildings.cities < requiredCities) {
      return { canBuild: false, reason: `Need ${requiredCities} cities for ${country.buildings.universities + 1} universities` };
    }
  }

  if (buildingType === 'factory') {
    // Requires at least 1 city per 2 factories
    const requiredCities = Math.ceil((country.buildings.factories + 1) / 2);
    if (country.buildings.cities < requiredCities) {
      return { canBuild: false, reason: `Need ${requiredCities} cities for ${country.buildings.factories + 1} factories` };
    }
  }

  return { canBuild: true };
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
  const { mapWidth, mapHeight, playerCount, aiCount, playerNames, playerColors } = config;
  
  // Generate map coordinates
  const coords = generateMapCoords(mapWidth, mapHeight);
  
  // Create players
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
  
  // Create neutral player
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
  
  // Create countries
  const countries: Record<string, Country> = {};
  coords.forEach((coord) => {
    const id = coordToId(coord);
    countries[id] = {
      id,
      coord,
      ownerId: null, // will be assigned below
      resources: { money: 0, education: 0, technology: 0, army: 0 },
      buildings: { cities: 0, universities: 0, factories: 0, bases: 0 },
      naturalResources: Math.random() > 0.5,
    };
  });
  
  // Assign starting positions - spread players as far apart as possible
  const startingPositions = getStartingPositions(coords, totalPlayers);
  startingPositions.forEach((coord, i) => {
    const countryId = coordToId(coord);
    const playerId = turnOrder[i];
    countries[countryId].ownerId = playerId;
    countries[countryId].resources = { money: 15000, education: 0, technology: 0, army: 0 };
    countries[countryId].buildings = { cities: 1, universities: 0, factories: 0, bases: 0 };
  });
  
  // Set up neutral countries
  Object.values(countries).forEach((country) => {
    if (country.ownerId === null) {
      country.ownerId = neutralId;
      country.resources = {
        money: Math.floor(Math.random() * 20) * 1000 + 1000, // 1000-20000
        education: 0,
        technology: 0,
        army: Math.floor(Math.random() * 21) * 50, // 0-1000 in increments of 50
      };
      country.buildings = {
        cities: Math.floor(Math.random() * 5), // 0-4
        universities: 0,
        factories: 0,
        bases: 0,
      };
    }
  });
  
  // Randomize first player
  const shuffledOrder = [...turnOrder].sort(() => Math.random() - 0.5);
  
  return {
    phase: 'planning',
    round: 1,
    currentPlayerIndex: 0,
    turnDirection: 1,
    turnOrder: shuffledOrder,
    players,
    countries,
    mapSize: { width: mapWidth, height: mapHeight },
    plannedActions: [],
    combatLog: [],
    winner: null,
  };
}

// Get starting positions spread across the map
function getStartingPositions(coords: { q: number; r: number }[], playerCount: number): { q: number; r: number }[] {
  if (coords.length < playerCount) return coords.slice(0, playerCount);
  
  const positions: { q: number; r: number }[] = [];
  const available = [...coords];
  
  // Pick first position randomly
  const firstIdx = Math.floor(Math.random() * available.length);
  positions.push(available[firstIdx]);
  available.splice(firstIdx, 1);
  
  // Pick remaining positions maximizing minimum distance
  while (positions.length < playerCount && available.length > 0) {
    let bestIdx = 0;
    let bestMinDist = -1;
    
    for (let i = 0; i < available.length; i++) {
      const candidate = available[i];
      let minDist = Infinity;
      
      for (const pos of positions) {
        const dist = Math.abs(candidate.q - pos.q) + Math.abs(candidate.r - pos.r);
        minDist = Math.min(minDist, dist);
      }
      
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestIdx = i;
      }
    }
    
    positions.push(available[bestIdx]);
    available.splice(bestIdx, 1);
  }
  
  return positions;
}

// Get countries owned by a player
export function getPlayerCountries(playerId: string, countries: Record<string, Country>): Country[] {
  return Object.values(countries).filter((c) => c.ownerId === playerId);
}

// Check if attack is valid
export function canAttack(
  fromCountry: Country,
  toCountry: Country,
  amount: number,
  player: Player,
  allPlayers: Record<string, Player>
): { canAttack: boolean; reason?: string } {
  // Check ownership
  if (fromCountry.ownerId !== player.id) {
    return { canAttack: false, reason: 'You do not own this country' };
  }
  
  // Check adjacency
  if (!areNeighbors(fromCountry.coord, toCountry.coord)) {
    return { canAttack: false, reason: 'Target must be adjacent' };
  }
  
  // Check minimum army
  if (amount < 100) {
    return { canAttack: false, reason: 'Minimum 100 army to attack' };
  }
  
  // Check available army
  if (fromCountry.resources.army < amount) {
    return { canAttack: false, reason: 'Not enough army' };
  }
  
  // Cannot attack own country
  if (toCountry.ownerId === player.id) {
    return { canAttack: false, reason: 'Cannot attack your own country' };
  }
  
  // Cannot attack allies
  if (toCountry.ownerId && player.allies.includes(toCountry.ownerId)) {
    return { canAttack: false, reason: 'Cannot attack allies' };
  }
  
  return { canAttack: true };
}

// Get adjacent countries that can be attacked
export function getAttackableCountries(
  fromCountry: Country,
  countries: Record<string, Country>,
  player: Player
): Country[] {
  const neighbors = getNeighbors(fromCountry.coord);
  return neighbors
    .map((coord) => countries[coordToId(coord)])
    .filter((c) => c && c.ownerId !== player.id && !player.allies.includes(c.ownerId || ''));
}

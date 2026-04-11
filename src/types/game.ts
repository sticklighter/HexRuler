// HexRuler Game Types

export interface HexCoord {
  q: number; // column (axial coordinate)
  r: number; // row (axial coordinate)
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isAI: boolean;
  isNeutral: boolean;
  isEliminated: boolean;
  allies: string[]; // player IDs
  pendingAllianceRequests: string[]; // player IDs who sent requests
  outgoingAllianceRequests: string[]; // player IDs to whom requests were sent
}

export interface Resources {
  money: number;
  education: number;
  technology: number;
  army: number;
}

export interface Buildings {
  cities: number;
  universities: number;
  factories: number;
  bases: number;
  baseUpgrades: number; // 0, 1, or 2
}

export interface Country {
  id: string;
  coord: HexCoord;
  ownerId: string | null; // null = neutral
  resources: Resources;
  buildings: Buildings;
  naturalResources: boolean; // for neutral countries
}

export interface PlannedAction {
  type: 'build' | 'move' | 'attack' | 'alliance_request' | 'alliance_break' | 'upgrade_base';
  playerId: string;
  data: BuildAction | MoveAction | AttackAction | AllianceAction | UpgradeBaseAction;
}

export interface BuildAction {
  countryId: string;
  buildingType: 'city' | 'university' | 'factory' | 'base';
}

export interface UpgradeBaseAction {
  countryId: string;
}

export interface MoveAction {
  fromCountryId: string;
  toCountryId: string;
  amount: number;
}

export interface AttackAction {
  fromCountryId: string;
  toCountryId: string;
  amount: number;
}

export interface AllianceAction {
  targetPlayerId: string;
}

export interface GameState {
  phase: 'setup' | 'planning' | 'resolution' | 'gameover';
  round: number;
  currentPlayerIndex: number;
  turnDirection: 1 | -1; // 1 = forward, -1 = backward (snake)
  turnOrder: string[]; // player IDs in order
  players: Record<string, Player>;
  countries: Record<string, Country>;
  mapSize: { width: number; height: number };
  plannedActions: PlannedAction[];
  combatLog: CombatLogEntry[];
  winner: string | null;
}

export interface CombatLogEntry {
  round: number;
  attackerId: string;
  defenderId: string | null;
  attackerCountry: string;
  defenderCountry: string;
  attackerArmy: number;
  defenderArmy: number;
  result: 'attacker_wins' | 'defender_wins' | 'tie';
  remainingArmy: number;
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  playerCount: number;
  aiCount: number;
  playerNames: string[];
  playerColors: string[];
  initialAlliances?: [string, string][]; // pairs of player indices for initial alliances
}

export const BUILDING_COSTS: Record<string, { money: number; education: number; technology: number }> = {
  city: { money: 10000, education: 0, technology: 0 },
  university: { money: 5000, education: 0, technology: 0 },
  factory: { money: 2500, education: 2500, technology: 0 },
  base: { money: 20000, education: 5000, technology: 10000 },
};

// Base upgrade costs
export const BASE_UPGRADE_COSTS: { money: number; education: number; technology: number }[] = [
  { money: 10000, education: 2500, technology: 5000 }, // First upgrade
  { money: 5000, education: 1250, technology: 2500 },  // Second upgrade
];

// Base upgrade army bonuses
export const BASE_UPGRADE_BONUSES: number[] = [500, 250];

// Building upkeep costs per turn
export const BUILDING_UPKEEP: Record<string, { money: number; technology: number }> = {
  university: { money: 500, technology: 0 },
  factory: { money: 200, technology: 0 },
  base: { money: 1000, technology: 200 },
};

export const BUILDING_LIMITS: Record<string, number> = {
  city: 4,
  university: 2,
  factory: 8,
  base: 1,
};

export const PLAYER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export const NEUTRAL_COLOR = '#6B7280'; // gray

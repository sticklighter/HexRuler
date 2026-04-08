// AI Logic for HexRuler
import type { GameState, Country, Player, PlannedAction, BuildAction, MoveAction, AttackAction, Buildings } from '@/types/game';
import { canBuild, getPlayerCountries, getAttackableCountries, canAttack, getPlayerTotalResources } from '@/utils/gameUtils';
import { getNeighbors, coordToId } from '@/utils/hexUtils';
import { BUILDING_COSTS, BUILDING_LIMITS } from '@/types/game';

// Generate AI actions for a player (including neutral countries)
export function generateAIActions(playerId: string, gameState: GameState): PlannedAction[] {
  const actions: PlannedAction[] = [];
  const player = gameState.players[playerId];
  const playerCountries = getPlayerCountries(playerId, gameState.countries);
  
  if (playerCountries.length === 0 || player.isEliminated) return actions;
  
  // For neutral countries, each country builds independently using its own resources
  if (player.isNeutral) {
    for (const country of playerCountries) {
      // Each neutral country uses only its own resources
      const resources = { ...country.resources };
      const pending: Buildings = { 
        cities: country.buildings.cities, 
        universities: country.buildings.universities, 
        factories: country.buildings.factories, 
        bases: country.buildings.bases 
      };
      
      // Build cities first (up to 4)
      while (pending.cities < BUILDING_LIMITS.city && resources.money >= BUILDING_COSTS.city.money) {
        const tempCountry = { ...country, buildings: { ...pending } };
        const check = canBuild(tempCountry, 'city', resources);
        if (check.canBuild) {
          actions.push({
            type: 'build',
            playerId,
            data: { countryId: country.id, buildingType: 'city' } as BuildAction,
          });
          resources.money -= BUILDING_COSTS.city.money;
          pending.cities++;
        } else break;
      }
      
      // Build universities
      while (pending.universities < BUILDING_LIMITS.university && 
             resources.money >= BUILDING_COSTS.university.money) {
        const tempCountry = { ...country, buildings: { ...pending } };
        const check = canBuild(tempCountry, 'university', resources);
        if (check.canBuild) {
          actions.push({
            type: 'build',
            playerId,
            data: { countryId: country.id, buildingType: 'university' } as BuildAction,
          });
          resources.money -= BUILDING_COSTS.university.money;
          pending.universities++;
        } else break;
      }
      
      // Build factories
      while (pending.factories < BUILDING_LIMITS.factory && 
             resources.money >= BUILDING_COSTS.factory.money && 
             resources.education >= BUILDING_COSTS.factory.education) {
        const tempCountry = { ...country, buildings: { ...pending } };
        const check = canBuild(tempCountry, 'factory', resources);
        if (check.canBuild) {
          actions.push({
            type: 'build',
            playerId,
            data: { countryId: country.id, buildingType: 'factory' } as BuildAction,
          });
          resources.money -= BUILDING_COSTS.factory.money;
          resources.education -= BUILDING_COSTS.factory.education;
          pending.factories++;
        } else break;
      }
      
      // Build base
      if (pending.bases < BUILDING_LIMITS.base &&
          resources.money >= BUILDING_COSTS.base.money && 
          resources.education >= BUILDING_COSTS.base.education &&
          resources.technology >= BUILDING_COSTS.base.technology) {
        const tempCountry = { ...country, buildings: { ...pending } };
        const check = canBuild(tempCountry, 'base', resources);
        if (check.canBuild) {
          actions.push({
            type: 'build',
            playerId,
            data: { countryId: country.id, buildingType: 'base' } as BuildAction,
          });
        }
      }
    }
    return actions; // Neutrals don't attack or move
  }
  
  // Non-neutral AI: Use total resources across all countries
  const resources = { ...getPlayerTotalResources(playerId, gameState.countries) };
  
  // Track pending building counts per country (don't mutate original countries!)
  const pendingBuildings: Record<string, Buildings> = {};
  playerCountries.forEach(c => {
    pendingBuildings[c.id] = { 
      cities: c.buildings.cities, 
      universities: c.buildings.universities, 
      factories: c.buildings.factories, 
      bases: c.buildings.bases 
    };
  });
  
  // Track army per country
  const countryArmy: Record<string, number> = {};
  playerCountries.forEach(c => {
    countryArmy[c.id] = c.resources.army;
  });
  
  // 1. Building Phase - prioritize economy then military
  for (const country of playerCountries) {
    const pending = pendingBuildings[country.id];
    
    // Build cities first (up to 4)
    while (pending.cities < BUILDING_LIMITS.city && resources.money >= BUILDING_COSTS.city.money) {
      const tempCountry = { ...country, buildings: { ...pending } };
      const check = canBuild(tempCountry, 'city', resources);
      if (check.canBuild) {
        actions.push({
          type: 'build',
          playerId,
          data: { countryId: country.id, buildingType: 'city' } as BuildAction,
        });
        resources.money -= BUILDING_COSTS.city.money;
        pending.cities++;
      } else break;
    }
    
    // Build universities (need 2 cities per university)
    while (pending.universities < BUILDING_LIMITS.university && 
           resources.money >= BUILDING_COSTS.university.money) {
      const tempCountry = { ...country, buildings: { ...pending } };
      const check = canBuild(tempCountry, 'university', resources);
      if (check.canBuild) {
        actions.push({
          type: 'build',
          playerId,
          data: { countryId: country.id, buildingType: 'university' } as BuildAction,
        });
        resources.money -= BUILDING_COSTS.university.money;
        pending.universities++;
      } else break;
    }
    
    // Build factories (need 1 city per 2 factories)
    while (pending.factories < BUILDING_LIMITS.factory && 
           resources.money >= BUILDING_COSTS.factory.money && 
           resources.education >= BUILDING_COSTS.factory.education) {
      const tempCountry = { ...country, buildings: { ...pending } };
      const check = canBuild(tempCountry, 'factory', resources);
      if (check.canBuild) {
        actions.push({
          type: 'build',
          playerId,
          data: { countryId: country.id, buildingType: 'factory' } as BuildAction,
        });
        resources.money -= BUILDING_COSTS.factory.money;
        resources.education -= BUILDING_COSTS.factory.education;
        pending.factories++;
      } else break;
    }
    
    // Build bases for military (max 1 per country)
    if (pending.bases < BUILDING_LIMITS.base &&
        resources.money >= BUILDING_COSTS.base.money && 
        resources.education >= BUILDING_COSTS.base.education &&
        resources.technology >= BUILDING_COSTS.base.technology) {
      const tempCountry = { ...country, buildings: { ...pending } };
      const check = canBuild(tempCountry, 'base', resources);
      if (check.canBuild) {
        actions.push({
          type: 'build',
          playerId,
          data: { countryId: country.id, buildingType: 'base' } as BuildAction,
        });
        resources.money -= BUILDING_COSTS.base.money;
        resources.education -= BUILDING_COSTS.base.education;
        resources.technology -= BUILDING_COSTS.base.technology;
        pending.bases++;
      }
    }
  }
  
  // 2. Attack Phase - find and attack weak targets
  let bestAttack: { from: Country; to: Country; amount: number } | null = null;
  let bestValue = 0;
  
  for (const country of playerCountries) {
    const attackable = getAttackableCountries(country, gameState.countries, player);
    
    for (const target of attackable) {
      const availableArmy = countryArmy[country.id] || 0;
      const defenderArmy = target.resources.army;
      
      // Only attack if we have overwhelming force
      const armyNeeded = defenderArmy + 100;
      
      if (availableArmy > armyNeeded) {
        // Value = enemy buildings + army saved
        const value = (target.buildings.cities * 4 + target.buildings.universities * 3 + 
                       target.buildings.factories * 2 + target.buildings.bases * 5) * 1000 - defenderArmy;
        
        if (value > bestValue) {
          bestValue = value;
          bestAttack = { from: country, to: target, amount: Math.min(availableArmy, defenderArmy + 500) };
        }
      }
    }
  }
  
  if (bestAttack) {
    const check = canAttack(bestAttack.from, bestAttack.to, bestAttack.amount, player, gameState.players);
    if (check.canAttack) {
      actions.push({
        type: 'attack',
        playerId,
        data: {
          fromCountryId: bestAttack.from.id,
          toCountryId: bestAttack.to.id,
          amount: bestAttack.amount,
        } as AttackAction,
      });
      countryArmy[bestAttack.from.id] -= bestAttack.amount;
    }
  }
  
  // 3. Move Phase - consolidate armies to borders
  const borderCountries = playerCountries.filter(c => {
    const neighbors = getNeighbors(c.coord);
    return neighbors.some(n => {
      const neighbor = gameState.countries[coordToId(n)];
      return neighbor && neighbor.ownerId !== playerId && !player.allies.includes(neighbor.ownerId || '');
    });
  });
  
  if (borderCountries.length > 0) {
    const safeCountries = playerCountries.filter(c => !borderCountries.includes(c));
    
    for (const safe of safeCountries) {
      const armyToMove = countryArmy[safe.id] || 0;
      if (armyToMove > 0) {
        const target = borderCountries.reduce((min, c) => 
          (countryArmy[c.id] || 0) < (countryArmy[min.id] || 0) ? c : min
        );
        
        actions.push({
          type: 'move',
          playerId,
          data: {
            fromCountryId: safe.id,
            toCountryId: target.id,
            amount: armyToMove,
          } as MoveAction,
        });
        countryArmy[target.id] = (countryArmy[target.id] || 0) + armyToMove;
        countryArmy[safe.id] = 0;
      }
    }
  }
  
  return actions;
}

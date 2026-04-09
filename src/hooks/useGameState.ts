// Game State Management Hook
import { useState, useCallback } from 'react';
import type {
  GameState,
  GameConfig,
  PlannedAction,
  BuildAction,
  MoveAction,
  AttackAction,
  CombatLogEntry,
  Country,
} from '@/types/game';
import { BUILDING_COSTS } from '@/types/game';
import {
  initializeGame,
  calculateIncome,
  resolveCombat,
  getPlayerCountries,
  getPlayerTotalResources,
  canBuild,
  canAttack,
} from '@/utils/gameUtils';
import { generateAIActions } from '@/utils/aiUtils';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PlannedAction[]>([]);
  
  // Start a new game
  const startGame = useCallback((config: GameConfig) => {
    const newState = initializeGame(config);
    setGameState(newState);
    setPendingActions([]);
    setSelectedCountryId(null);
  }, []);
  
  // Reset to setup screen
  const resetGame = useCallback(() => {
    setGameState(null);
    setPendingActions([]);
    setSelectedCountryId(null);
  }, []);
  
  // Get current player
  const getCurrentPlayer = useCallback(() => {
    if (!gameState) return null;
    return gameState.players[gameState.turnOrder[gameState.currentPlayerIndex]];
  }, [gameState]);
  
  // Add a building action
  const addBuildAction = useCallback((countryId: string, buildingType: 'city' | 'university' | 'factory' | 'base') => {
    if (!gameState) return false;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return false;
    
    const country = gameState.countries[countryId];
    if (!country || country.ownerId !== currentPlayer.id) return false;
    
    // Calculate resources after pending actions
    const resources = getPlayerTotalResources(currentPlayer.id, gameState.countries);
    
    // Subtract costs of pending build actions
    pendingActions.forEach(action => {
      if (action.type === 'build' && action.playerId === currentPlayer.id) {
        const buildData = action.data as BuildAction;
        const cost = BUILDING_COSTS[buildData.buildingType];
        resources.money -= cost.money;
        resources.education -= cost.education;
        resources.technology -= cost.technology;
      }
    });
    
    // Count pending builds for this country
    const pendingBuilds: Record<string, number> = { city: 0, university: 0, factory: 0, base: 0 };
    pendingActions.forEach(action => {
      if (action.type === 'build') {
        const buildData = action.data as BuildAction;
        if (buildData.countryId === countryId) {
          pendingBuilds[buildData.buildingType]++;
        }
      }
    });
    
    // Create temp country with pending builds
    const tempCountry = {
      ...country,
      buildings: {
        cities: country.buildings.cities + pendingBuilds.city,
        universities: country.buildings.universities + pendingBuilds.university,
        factories: country.buildings.factories + pendingBuilds.factory,
        bases: country.buildings.bases + pendingBuilds.base,
      },
    };
    
    const check = canBuild(tempCountry, buildingType, resources);
    if (!check.canBuild) return false;
    
    setPendingActions(prev => [
      ...prev,
      {
        type: 'build',
        playerId: currentPlayer.id,
        data: { countryId, buildingType } as BuildAction,
      },
    ]);
    
    return true;
  }, [gameState, getCurrentPlayer, pendingActions]);
  
  // Add a move action
  const addMoveAction = useCallback((fromCountryId: string, toCountryId: string, amount: number) => {
    if (!gameState) return false;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return false;
    
    const fromCountry = gameState.countries[fromCountryId];
    const toCountry = gameState.countries[toCountryId];
    
    if (!fromCountry || !toCountry) return false;
    if (fromCountry.ownerId !== currentPlayer.id || toCountry.ownerId !== currentPlayer.id) return false;
    
    // Calculate available army after pending moves/attacks
    let availableArmy = fromCountry.resources.army;
    pendingActions.forEach(action => {
      if (action.type === 'move' || action.type === 'attack') {
        const moveData = action.data as MoveAction | AttackAction;
        if (moveData.fromCountryId === fromCountryId) {
          availableArmy -= moveData.amount;
        }
        if (action.type === 'move' && moveData.toCountryId === fromCountryId) {
          availableArmy += moveData.amount;
        }
      }
    });
    
    if (availableArmy < amount) return false;
    
    setPendingActions(prev => [
      ...prev,
      {
        type: 'move',
        playerId: currentPlayer.id,
        data: { fromCountryId, toCountryId, amount } as MoveAction,
      },
    ]);
    
    return true;
  }, [gameState, getCurrentPlayer, pendingActions]);
  
  // Add an attack action
  const addAttackAction = useCallback((fromCountryId: string, toCountryId: string, amount: number) => {
    if (!gameState) return false;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return false;
    
    const fromCountry = gameState.countries[fromCountryId];
    const toCountry = gameState.countries[toCountryId];
    
    if (!fromCountry || !toCountry) return false;
    
    // Calculate available army after pending moves/attacks
    let availableArmy = fromCountry.resources.army;
    pendingActions.forEach(action => {
      if (action.type === 'move' || action.type === 'attack') {
        const moveData = action.data as MoveAction | AttackAction;
        if (moveData.fromCountryId === fromCountryId) {
          availableArmy -= moveData.amount;
        }
        if (action.type === 'move' && moveData.toCountryId === fromCountryId) {
          availableArmy += moveData.amount;
        }
      }
    });
    
    const check = canAttack(
      { ...fromCountry, resources: { ...fromCountry.resources, army: availableArmy } },
      toCountry,
      amount,
      currentPlayer,
      gameState.players
    );
    
    if (!check.canAttack) return false;
    
    setPendingActions(prev => [
      ...prev,
      {
        type: 'attack',
        playerId: currentPlayer.id,
        data: { fromCountryId, toCountryId, amount } as AttackAction,
      },
    ]);
    
    return true;
  }, [gameState, getCurrentPlayer, pendingActions]);
  
  // Remove a pending action
  const removePendingAction = useCallback((index: number) => {
    setPendingActions(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);
  
  // End turn
  const endTurn = useCallback(() => {
    if (!gameState) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      
      // Add pending actions to planned actions
      const allPlannedActions = [...prev.plannedActions, ...pendingActions];
      
      // Move to next player
      let nextIndex = prev.currentPlayerIndex + prev.turnDirection;
      let nextDirection = prev.turnDirection;
      let nextRound = prev.round;
      let shouldResolve = false;
      
      // Check if round ended
      if (nextIndex < 0 || nextIndex >= prev.turnOrder.length) {
        shouldResolve = true;
      } else {
        // Skip eliminated players
        while (nextIndex >= 0 && nextIndex < prev.turnOrder.length) {
          const nextPlayer = prev.players[prev.turnOrder[nextIndex]];
          if (!nextPlayer.isEliminated && !nextPlayer.isNeutral) break;
          nextIndex += prev.turnDirection;
        }
        
        if (nextIndex < 0 || nextIndex >= prev.turnOrder.length) {
          shouldResolve = true;
        }
      }
      
      if (shouldResolve) {
        // Time to resolve the round!
        return resolveRound({ ...prev, plannedActions: allPlannedActions });
      }
      
      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        plannedActions: allPlannedActions,
      };
    });
    
    setPendingActions([]);
  }, [gameState, pendingActions]);
  
  // Resolve a round
  const resolveRound = (state: GameState): GameState => {
    let newState = { ...state };
    const newCountries = { ...state.countries };
    const newPlayers = { ...state.players };
    const combatLog: CombatLogEntry[] = [];
    
    // First, generate AI actions for all AI players (including neutrals!)
    const aiActions: PlannedAction[] = [];
    state.turnOrder.forEach(playerId => {
      const player = state.players[playerId];
      if (player.isAI && !player.isEliminated) {
        aiActions.push(...generateAIActions(playerId, state));
      }
    });
    
    // Also generate actions for neutral player (not in turnOrder)
    const neutralPlayer = state.players['neutral'];
    if (neutralPlayer && !neutralPlayer.isEliminated) {
      aiActions.push(...generateAIActions('neutral', state));
    }
    
    const allActions = [...state.plannedActions, ...aiActions];
    
    // Process actions in turn order (non-neutral players first)
    state.turnOrder.forEach(playerId => {
      const playerActions = allActions.filter(a => a.playerId === playerId);
      
      // Process builds first
      playerActions.filter(a => a.type === 'build').forEach(action => {
        const data = action.data as BuildAction;
        const country = newCountries[data.countryId];
        if (country && country.ownerId === playerId) {
          const cost = BUILDING_COSTS[data.buildingType];
          
          // Deduct costs from player's countries (pick one with resources)
          const playerCountries = Object.values(newCountries).filter(c => c.ownerId === playerId);
          let remainingMoney = cost.money;
          let remainingEdu = cost.education;
          let remainingTech = cost.technology;
          
          for (const pc of playerCountries) {
            const moneyTake = Math.min(pc.resources.money, remainingMoney);
            const eduTake = Math.min(pc.resources.education, remainingEdu);
            const techTake = Math.min(pc.resources.technology, remainingTech);
            
            newCountries[pc.id] = {
              ...newCountries[pc.id],
              resources: {
                ...newCountries[pc.id].resources,
                money: newCountries[pc.id].resources.money - moneyTake,
                education: newCountries[pc.id].resources.education - eduTake,
                technology: newCountries[pc.id].resources.technology - techTake,
              },
            };
            
            remainingMoney -= moneyTake;
            remainingEdu -= eduTake;
            remainingTech -= techTake;
            
            if (remainingMoney <= 0 && remainingEdu <= 0 && remainingTech <= 0) break;
          }
          
          // Add building
          const buildKey = data.buildingType === 'city' ? 'cities' :
                          data.buildingType === 'university' ? 'universities' :
                          data.buildingType === 'factory' ? 'factories' : 'bases';
          newCountries[data.countryId] = {
            ...newCountries[data.countryId],
            buildings: {
              ...newCountries[data.countryId].buildings,
              [buildKey]: newCountries[data.countryId].buildings[buildKey] + 1,
            },
          };
        }
      });
      
      // Process moves
      playerActions.filter(a => a.type === 'move').forEach(action => {
        const data = action.data as MoveAction;
        const fromCountry = newCountries[data.fromCountryId];
        const toCountry = newCountries[data.toCountryId];
        
        if (fromCountry && toCountry && fromCountry.ownerId === playerId && toCountry.ownerId === playerId) {
          const amount = Math.min(data.amount, fromCountry.resources.army);
          newCountries[data.fromCountryId] = {
            ...newCountries[data.fromCountryId],
            resources: {
              ...newCountries[data.fromCountryId].resources,
              army: newCountries[data.fromCountryId].resources.army - amount,
            },
          };
          newCountries[data.toCountryId] = {
            ...newCountries[data.toCountryId],
            resources: {
              ...newCountries[data.toCountryId].resources,
              army: newCountries[data.toCountryId].resources.army + amount,
            },
          };
        }
      });
      
      // Process attacks
      playerActions.filter(a => a.type === 'attack').forEach(action => {
        const data = action.data as AttackAction;
        const fromCountry = newCountries[data.fromCountryId];
        const toCountry = newCountries[data.toCountryId];
        
        if (fromCountry && toCountry && fromCountry.ownerId === playerId) {
          const attackerArmy = Math.min(data.amount, fromCountry.resources.army);
          const defenderArmy = toCountry.resources.army;
          
          if (attackerArmy >= 100) {
            const result = resolveCombat(attackerArmy, defenderArmy);
            
            combatLog.push({
              round: state.round,
              attackerId: playerId,
              defenderId: toCountry.ownerId,
              attackerCountry: data.fromCountryId,
              defenderCountry: data.toCountryId,
              attackerArmy,
              defenderArmy,
              result: result.result,
              remainingArmy: result.remainingArmy,
            });
            
            // Deduct attacking army from source
            newCountries[data.fromCountryId] = {
              ...newCountries[data.fromCountryId],
              resources: {
                ...newCountries[data.fromCountryId].resources,
                army: newCountries[data.fromCountryId].resources.army - attackerArmy,
              },
            };
            
            if (result.result === 'attacker_wins') {
              // Transfer ownership, destroy bases
              const oldOwner = toCountry.ownerId;
              newCountries[data.toCountryId] = {
                ...newCountries[data.toCountryId],
                ownerId: playerId,
                resources: {
                  ...newCountries[data.toCountryId].resources,
                  army: result.remainingArmy,
                },
                buildings: {
                  ...newCountries[data.toCountryId].buildings,
                  bases: 0, // Bases destroyed on conquest
                },
              };
              
              // Check if defender is eliminated
              if (oldOwner && oldOwner !== 'neutral') {
                const defenderCountries = Object.values(newCountries).filter(c => c.ownerId === oldOwner);
                if (defenderCountries.length === 0) {
                  newPlayers[oldOwner] = { ...newPlayers[oldOwner], isEliminated: true };
                }
              }
            } else if (result.result === 'defender_wins') {
              newCountries[data.toCountryId] = {
                ...newCountries[data.toCountryId],
                resources: {
                  ...newCountries[data.toCountryId].resources,
                  army: result.remainingArmy,
                },
              };
            } else {
              // Tie - defender wins, both armies destroyed
              newCountries[data.toCountryId] = {
                ...newCountries[data.toCountryId],
                resources: {
                  ...newCountries[data.toCountryId].resources,
                  army: 0,
                },
              };
            }
          }
        }
      });
    });
    
    // Process neutral player's build actions (neutrals only build, don't move or attack)
    const neutralActions = allActions.filter(a => a.playerId === 'neutral');
    neutralActions.filter(a => a.type === 'build').forEach(action => {
      const data = action.data as BuildAction;
      const country = newCountries[data.countryId];
      if (country && country.ownerId === 'neutral') {
        const cost = BUILDING_COSTS[data.buildingType];
        
        // Deduct costs from this specific country's resources
        if (country.resources.money >= cost.money &&
            country.resources.education >= cost.education &&
            country.resources.technology >= cost.technology) {
          
          newCountries[data.countryId] = {
            ...newCountries[data.countryId],
            resources: {
              ...newCountries[data.countryId].resources,
              money: newCountries[data.countryId].resources.money - cost.money,
              education: newCountries[data.countryId].resources.education - cost.education,
              technology: newCountries[data.countryId].resources.technology - cost.technology,
            },
          };
          
          // Add building
          const buildKey = data.buildingType === 'city' ? 'cities' :
                          data.buildingType === 'university' ? 'universities' :
                          data.buildingType === 'factory' ? 'factories' : 'bases';
          newCountries[data.countryId] = {
            ...newCountries[data.countryId],
            buildings: {
              ...newCountries[data.countryId].buildings,
              [buildKey]: newCountries[data.countryId].buildings[buildKey] + 1,
            },
          };
        }
      }
    });
    
    // Process income for all countries
    Object.values(newCountries).forEach(country => {
      if (country.ownerId) {
        const player = newPlayers[country.ownerId];
        if (player && !player.isEliminated) {
          const income = calculateIncome(country, player, Object.values(newCountries));
          newCountries[country.id] = {
            ...newCountries[country.id],
            resources: {
              money: newCountries[country.id].resources.money + income.money,
              education: newCountries[country.id].resources.education + income.education,
              technology: newCountries[country.id].resources.technology + income.technology,
              army: newCountries[country.id].resources.army + income.army,
            },
          };
        }
      }
    });
    
    // Check for winner
    const activePlayers = Object.values(newPlayers).filter(p => !p.isEliminated && !p.isNeutral);
    let winner: string | null = null;
    
    if (activePlayers.length === 1) {
      winner = activePlayers[0].id;
    } else if (activePlayers.length === 2) {
      // Break all alliances if only 2 players left (per Chapter 8)
      activePlayers.forEach(p => {
        newPlayers[p.id] = { ...newPlayers[p.id], allies: [], pendingAllianceRequests: [], outgoingAllianceRequests: [] };
      });
    } else if (activePlayers.length > 2) {
      // Check if all remaining players are allies (no enemies left) - break alliances
      const firstPlayer = activePlayers[0];
      const allAllied = activePlayers.slice(1).every(p => firstPlayer.allies.includes(p.id));
      if (allAllied) {
        activePlayers.forEach(p => {
          newPlayers[p.id] = { ...newPlayers[p.id], allies: [], pendingAllianceRequests: [], outgoingAllianceRequests: [] };
        });
      }
    }
    
    // Set up next round
    const newDirection = (state.turnDirection * -1) as 1 | -1;
    let nextIndex = newDirection === 1 ? 0 : state.turnOrder.length - 1;
    
    // Skip eliminated players
    while (nextIndex >= 0 && nextIndex < state.turnOrder.length) {
      const nextPlayer = newPlayers[state.turnOrder[nextIndex]];
      if (!nextPlayer.isEliminated && !nextPlayer.isNeutral) break;
      nextIndex += newDirection;
    }
    
    return {
      ...state,
      phase: winner ? 'gameover' : 'planning',
      round: state.round + 1,
      currentPlayerIndex: nextIndex,
      turnDirection: newDirection,
      countries: newCountries,
      players: newPlayers,
      plannedActions: [],
      combatLog: [...state.combatLog, ...combatLog],
      winner,
    };
  };
  
  // Request alliance with another player
  const requestAlliance = useCallback((targetPlayerId: string) => {
    if (!gameState) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isAI) return;
    
    // Check if alliances are allowed (more than 2 active players)
    const activePlayers = Object.values(gameState.players).filter(
      p => !p.isEliminated && !p.isNeutral
    );
    if (activePlayers.length <= 2) return;
    
    // Cannot request if already allies or already requested
    if (currentPlayer.allies.includes(targetPlayerId)) return;
    if (currentPlayer.outgoingAllianceRequests.includes(targetPlayerId)) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentPlayer.id]: {
            ...prev.players[currentPlayer.id],
            outgoingAllianceRequests: [...prev.players[currentPlayer.id].outgoingAllianceRequests, targetPlayerId],
          },
          [targetPlayerId]: {
            ...prev.players[targetPlayerId],
            pendingAllianceRequests: [...prev.players[targetPlayerId].pendingAllianceRequests, currentPlayer.id],
          },
        },
      };
    });
  }, [gameState, getCurrentPlayer]);
  
  // Accept alliance request
  const acceptAlliance = useCallback((fromPlayerId: string) => {
    if (!gameState) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    // Check if request exists
    if (!currentPlayer.pendingAllianceRequests.includes(fromPlayerId)) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentPlayer.id]: {
            ...prev.players[currentPlayer.id],
            allies: [...prev.players[currentPlayer.id].allies, fromPlayerId],
            pendingAllianceRequests: prev.players[currentPlayer.id].pendingAllianceRequests.filter(id => id !== fromPlayerId),
          },
          [fromPlayerId]: {
            ...prev.players[fromPlayerId],
            allies: [...prev.players[fromPlayerId].allies, currentPlayer.id],
            outgoingAllianceRequests: prev.players[fromPlayerId].outgoingAllianceRequests.filter(id => id !== currentPlayer.id),
          },
        },
      };
    });
  }, [gameState, getCurrentPlayer]);
  
  // Reject alliance request
  const rejectAlliance = useCallback((fromPlayerId: string) => {
    if (!gameState) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentPlayer.id]: {
            ...prev.players[currentPlayer.id],
            pendingAllianceRequests: prev.players[currentPlayer.id].pendingAllianceRequests.filter(id => id !== fromPlayerId),
          },
          [fromPlayerId]: {
            ...prev.players[fromPlayerId],
            outgoingAllianceRequests: prev.players[fromPlayerId].outgoingAllianceRequests.filter(id => id !== currentPlayer.id),
          },
        },
      };
    });
  }, [gameState, getCurrentPlayer]);
  
  // Break existing alliance
  const breakAlliance = useCallback((allyId: string) => {
    if (!gameState) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;
    
    if (!currentPlayer.allies.includes(allyId)) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [currentPlayer.id]: {
            ...prev.players[currentPlayer.id],
            allies: prev.players[currentPlayer.id].allies.filter(id => id !== allyId),
          },
          [allyId]: {
            ...prev.players[allyId],
            allies: prev.players[allyId].allies.filter(id => id !== currentPlayer.id),
          },
        },
      };
    });
  }, [gameState, getCurrentPlayer]);
  
  return {
    gameState,
    selectedCountryId,
    setSelectedCountryId,
    pendingActions,
    startGame,
    resetGame,
    getCurrentPlayer,
    addBuildAction,
    addMoveAction,
    addAttackAction,
    removePendingAction,
    clearPendingActions,
    endTurn,
    requestAlliance,
    acceptAlliance,
    rejectAlliance,
    breakAlliance,
  };
}

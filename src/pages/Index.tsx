// HexRuler - Main Game Page
import { useCallback, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { SetupScreen } from '@/components/game/SetupScreen';
import { HexGrid } from '@/components/game/HexGrid';
import { GameHUD } from '@/components/game/GameHUD';
import { CountryPanel } from '@/components/game/CountryPanel';
import { PendingActionsPanel } from '@/components/game/PendingActionsPanel';
import { VictoryScreen } from '@/components/game/VictoryScreen';
import { PlayerList } from '@/components/game/PlayerList';
import { getAttackableCountries } from '@/utils/gameUtils';
import type { GameConfig } from '@/types/game';

export default function Index() {
  const {
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
  } = useGameState();

  const currentPlayer = getCurrentPlayer();

  // Handle AI turns automatically
  useEffect(() => {
    if (gameState && currentPlayer?.isAI && !currentPlayer.isNeutral && gameState.phase === 'planning') {
      // Small delay before AI acts
      const timer = setTimeout(() => {
        endTurn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentPlayer, endTurn]);

  const handleStartGame = useCallback((config: GameConfig) => {
    startGame(config);
  }, [startGame]);

  const handleSelectCountry = useCallback((countryId: string) => {
    setSelectedCountryId((prev) => prev === countryId ? null : countryId);
  }, [setSelectedCountryId]);

  const handleBuild = useCallback((buildingType: 'city' | 'university' | 'factory' | 'base') => {
    if (!selectedCountryId) return false;
    return addBuildAction(selectedCountryId, buildingType);
  }, [selectedCountryId, addBuildAction]);

  const handleMove = useCallback((toCountryId: string, amount: number) => {
    if (!selectedCountryId) return false;
    return addMoveAction(selectedCountryId, toCountryId, amount);
  }, [selectedCountryId, addMoveAction]);

  const handleAttack = useCallback((toCountryId: string, amount: number) => {
    if (!selectedCountryId) return false;
    return addAttackAction(selectedCountryId, toCountryId, amount);
  }, [selectedCountryId, addAttackAction]);

  const handleNewGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Show setup screen if no game
  if (!gameState) {
    return <SetupScreen onStartGame={handleStartGame} />;
  }

  // Get selected country and its attackable neighbors
  const selectedCountry = selectedCountryId ? gameState.countries[selectedCountryId] : null;
  const selectedOwner = selectedCountry?.ownerId ? gameState.players[selectedCountry.ownerId] : null;

  // Get attack target IDs for highlighting
  const attackTargetIds = selectedCountry && currentPlayer && selectedCountry.ownerId === currentPlayer.id ?
  getAttackableCountries(selectedCountry, gameState.countries, currentPlayer).map((c) => c.id) :
  [];

  // Check for winner
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;

  return (
    <div data-ev-id="ev_97663b5058" className="h-screen w-screen overflow-hidden bg-slate-900">
      {/* Main hex grid */}
      <HexGrid
        gameState={gameState}
        selectedCountryId={selectedCountryId}
        attackTargetIds={attackTargetIds}
        currentPlayerId={currentPlayer?.id || null}
        onSelectCountry={handleSelectCountry} />

      
      {/* HUD */}
      {currentPlayer &&
      <GameHUD
        gameState={gameState}
        currentPlayer={currentPlayer}
        pendingActionsCount={pendingActions.length}
        onEndTurn={endTurn}
        onClearActions={clearPendingActions} />

      }
      
      {/* Player list */}
      <PlayerList
        gameState={gameState}
        currentPlayerId={currentPlayer?.id || null} />

      
      {/* Pending actions */}
      <PendingActionsPanel
        actions={pendingActions}
        gameState={gameState}
        onRemoveAction={removePendingAction} />

      
      {/* Selected country panel */}
      {selectedCountry && currentPlayer &&
      <CountryPanel
        country={selectedCountry}
        owner={selectedOwner}
        currentPlayer={currentPlayer}
        gameState={gameState}
        pendingActions={pendingActions}
        onBuild={handleBuild}
        onMove={handleMove}
        onAttack={handleAttack}
        onClose={() => setSelectedCountryId(null)} />

      }
      
      {/* Victory screen */}
      {winner &&
      <VictoryScreen
        winner={winner}
        gameState={gameState}
        onNewGame={handleNewGame} />

      }
    </div>);

}

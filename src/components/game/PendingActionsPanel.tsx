// Pending Actions Panel - Shows queued actions for current turn
import type { PlannedAction, BuildAction, MoveAction, AttackAction, GameState } from '@/types/game';

interface PendingActionsPanelProps {
  actions: PlannedAction[];
  gameState: GameState;
  onRemoveAction: (index: number) => void;
}

export function PendingActionsPanel({ actions, gameState, onRemoveAction }: PendingActionsPanelProps) {
  if (actions.length === 0) return null;

  return (
    <div data-ev-id="ev_b801ee9ffe" className="absolute top-24 left-4 z-20 w-72 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div data-ev-id="ev_3c9bd56bab" className="p-3 border-b border-slate-700">
        <h3 data-ev-id="ev_e12c2620bc" className="text-white font-semibold text-sm">Pending Actions ({actions.length})</h3>
        <p data-ev-id="ev_4bdad6cc39" className="text-slate-500 text-xs">Click ✕ to cancel</p>
      </div>
      
      <div data-ev-id="ev_4e060937f6" className="max-h-64 overflow-y-auto">
        {actions.map((action, index) =>
        <div data-ev-id="ev_f56eabd352"
        key={index}
        className="flex items-center justify-between p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">

            <div data-ev-id="ev_5240b0f8cb" className="flex items-center gap-2">
              <ActionIcon type={action.type} />
              <div data-ev-id="ev_f3fa5203f5">
                <div data-ev-id="ev_c43cb7dcab" className="text-white text-sm">{getActionTitle(action, gameState)}</div>
                <div data-ev-id="ev_be246bbe8a" className="text-slate-400 text-xs">{getActionDetails(action, gameState)}</div>
              </div>
            </div>
            <button data-ev-id="ev_4009955a49"
          onClick={() => onRemoveAction(index)}
          className="text-slate-500 hover:text-red-400 transition-colors p-1">

              ✕
            </button>
          </div>
        )}
      </div>
    </div>);

}

function ActionIcon({ type }: {type: string;}) {
  const icons: Record<string, {emoji: string;bg: string;}> = {
    build: { emoji: '🛠️', bg: 'bg-amber-500/20' },
    move: { emoji: '🚩', bg: 'bg-blue-500/20' },
    attack: { emoji: '⚔️', bg: 'bg-red-500/20' },
    alliance_request: { emoji: '🤝', bg: 'bg-green-500/20' },
    alliance_break: { emoji: '💔', bg: 'bg-purple-500/20' }
  };
  const { emoji, bg } = icons[type] || { emoji: '❓', bg: 'bg-slate-500/20' };

  return (
    <div data-ev-id="ev_47f1ed08fd" className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
      {emoji}
    </div>);

}

function getActionTitle(action: PlannedAction, gameState: GameState): string {
  switch (action.type) {
    case 'build':{
        const data = action.data as BuildAction;
        return `Build ${data.buildingType}`;
      }
    case 'move':{
        const data = action.data as MoveAction;
        return `Move ${data.amount.toLocaleString()} army`;
      }
    case 'attack':{
        const data = action.data as AttackAction;
        return `Attack with ${data.amount.toLocaleString()}`;
      }
    default:
      return action.type;
  }
}

function getActionDetails(action: PlannedAction, gameState: GameState): string {
  switch (action.type) {
    case 'build':{
        const data = action.data as BuildAction;
        const country = gameState.countries[data.countryId];
        return `at (${country?.coord.q}, ${country?.coord.r})`;
      }
    case 'move':{
        const data = action.data as MoveAction;
        const from = gameState.countries[data.fromCountryId];
        const to = gameState.countries[data.toCountryId];
        return `(${from?.coord.q},${from?.coord.r}) → (${to?.coord.q},${to?.coord.r})`;
      }
    case 'attack':{
        const data = action.data as AttackAction;
        const from = gameState.countries[data.fromCountryId];
        const to = gameState.countries[data.toCountryId];
        const defender = to?.ownerId ? gameState.players[to.ownerId] : null;
        return `${defender?.name || 'Neutral'} at (${to?.coord.q},${to?.coord.r})`;
      }
    default:
      return '';
  }
}

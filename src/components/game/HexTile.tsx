// Individual Hex Tile Component
import type { Country, Player } from '@/types/game';
import { getHexPoints, hexToPixel, HEX_SIZE } from '@/utils/hexUtils';

interface HexTileProps {
  country: Country;
  player: Player | null;
  isSelected: boolean;
  isAttackTarget: boolean;
  isCurrentPlayerOwned: boolean;
  onClick: () => void;
  showDetails: boolean;
}

export function HexTile({
  country,
  player,
  isSelected,
  isAttackTarget,
  isCurrentPlayerOwned,
  onClick,
  showDetails
}: HexTileProps) {
  const { x, y } = hexToPixel(country.coord);
  const points = getHexPoints(0, 0, HEX_SIZE - 2);

  const fillColor = player?.color || '#4B5563';
  const strokeColor = isSelected ? '#FBBF24' : isAttackTarget ? '#EF4444' : '#1F2937';
  const strokeWidth = isSelected || isAttackTarget ? 4 : 2;

  const { cities, universities, factories, bases } = country.buildings;
  const { army, money } = country.resources;

  return (
    <g data-ev-id="ev_abffc006d7"
    transform={`translate(${x}, ${y})`}
    onClick={onClick}
    style={{ cursor: 'pointer' }}>

      {/* Hex shape */}
      <polygon data-ev-id="ev_fcfabf5480"
      points={points}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      opacity={isCurrentPlayerOwned ? 1 : 0.85} />

      
      {/* Highlight for owned countries */}
      {isCurrentPlayerOwned &&
      <polygon data-ev-id="ev_5c19709111"
      points={getHexPoints(0, 0, HEX_SIZE - 8)}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      opacity={0.3} />

      }
      
      {showDetails &&
      <>
          {/* Army count (center, large) */}
          <text data-ev-id="ev_d7a6a0fe27"
        x={0}
        y={-8}
        textAnchor="middle"
        fill="white"
        fontSize={army >= 1000 ? 11 : 13}
        fontWeight="bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>

            ⚔️ {formatNumber(army)}
          </text>
          
          {/* Buildings indicator */}
          <text data-ev-id="ev_3f97832409"
        x={0}
        y={8}
        textAnchor="middle"
        fill="white"
        fontSize={9}
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>

            🏙️{cities} 🎓{universities} 🏭{factories} 🏰{bases}
          </text>
          
          {/* Money (bottom) */}
          <text data-ev-id="ev_7e0b3599d3"
        x={0}
        y={22}
        textAnchor="middle"
        fill="#FCD34D"
        fontSize={9}
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>

            💰{formatNumber(money)}
          </text>
        </>
      }
      
      {!showDetails && (
      /* Minimal view - just army */
      <text data-ev-id="ev_05bb7a54af"
      x={0}
      y={4}
      textAnchor="middle"
      fill="white"
      fontSize={10}
      fontWeight="bold"
      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>

          {formatNumber(army)}
        </text>)
      }
    </g>);

}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toString();
}

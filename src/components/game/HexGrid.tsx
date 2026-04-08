// Hex Grid Component with Pan & Zoom
import { useRef, useState, useCallback, useEffect } from 'react';
import type { GameState } from '@/types/game';
import { HexTile } from '@/components/game/HexTile';
import { getMapBounds, HEX_SIZE } from '@/utils/hexUtils';

interface HexGridProps {
  gameState: GameState;
  selectedCountryId: string | null;
  attackTargetIds: string[];
  currentPlayerId: string | null;
  onSelectCountry: (countryId: string) => void;
}

export function HexGrid({
  gameState,
  selectedCountryId,
  attackTargetIds,
  currentPlayerId,
  onSelectCountry
}: HexGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, transformX: 0, transformY: 0 });
  const [showDetails, setShowDetails] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const bounds = getMapBounds(gameState.mapSize.width, gameState.mapSize.height);
  const padding = HEX_SIZE * 2;
  const mapWidth = bounds.maxX - bounds.minX + padding * 2;
  const mapHeight = bounds.maxY - bounds.minY + padding * 2;

  // Center map on initial load
  useEffect(() => {
    const centerMap = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const scaleX = rect.width / mapWidth;
        const scaleY = rect.height / mapHeight;
        const initialScale = Math.min(scaleX, scaleY, 1.5) * 0.85;

        const offsetX = (rect.width - mapWidth * initialScale) / 2 - (bounds.minX - padding) * initialScale;
        const offsetY = (rect.height - mapHeight * initialScale) / 2 - (bounds.minY - padding) * initialScale;

        setTransform({
          x: offsetX,
          y: offsetY,
          scale: initialScale
        });
        setShowDetails(initialScale > 0.4);
        setIsInitialized(true);
      }
    };

    const timer = setTimeout(centerMap, 100);
    return () => clearTimeout(timer);
  }, [gameState.mapSize.width, gameState.mapSize.height, bounds.minX, bounds.minY, mapWidth, mapHeight, padding]);

  // Native wheel event listener (non-passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.85 : 1.15;

      setTransform((prev) => {
        const newScale = Math.min(Math.max(prev.scale * delta, 0.15), 4);
        const scaleChange = newScale / prev.scale;
        const newX = mouseX - (mouseX - prev.x) * scaleChange;
        const newY = mouseY - (mouseY - prev.y) * scaleChange;
        setShowDetails(newScale > 0.4);
        return { x: newX, y: newY, scale: newScale };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Native mouse event listeners for drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Right-click or middle-click for dragging
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          transformX: transform.x,
          transformY: transform.y
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setTransform((prev) => ({
        ...prev,
        x: dragStartRef.current.transformX + deltaX,
        y: dragStartRef.current.transformY + deltaY
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        setIsDragging(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isDragging, transform.x, transform.y]);

  // Zoom controls
  const zoomIn = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTransform((prev) => {
      const newScale = Math.min(prev.scale * 1.3, 4);
      const scaleChange = newScale / prev.scale;
      setShowDetails(newScale > 0.4);
      return {
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
        scale: newScale
      };
    });
  };

  const zoomOut = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTransform((prev) => {
      const newScale = Math.max(prev.scale * 0.7, 0.15);
      const scaleChange = newScale / prev.scale;
      setShowDetails(newScale > 0.4);
      return {
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
        scale: newScale
      };
    });
  };

  const fitMap = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = rect.width / mapWidth;
      const scaleY = rect.height / mapHeight;
      const newScale = Math.min(scaleX, scaleY, 1.5) * 0.85;

      const offsetX = (rect.width - mapWidth * newScale) / 2 - (bounds.minX - padding) * newScale;
      const offsetY = (rect.height - mapHeight * newScale) / 2 - (bounds.minY - padding) * newScale;

      setTransform({ x: offsetX, y: offsetY, scale: newScale });
      setShowDetails(newScale > 0.4);
    }
  };

  return (
    <div data-ev-id="ev_eef5f0b418" className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Zoom Controls */}
      <div data-ev-id="ev_d51b5e7a63" className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button data-ev-id="ev_a6392fffa7"
        onClick={zoomIn}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          +
        </button>
        <button data-ev-id="ev_484bfd9c4c"
        onClick={zoomOut}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          −
        </button>
        <button data-ev-id="ev_aa679783db"
        onClick={fitMap}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
        title="Fit map to view">

          ⊡
        </button>
      </div>

      {/* Instructions */}
      <div data-ev-id="ev_203093f2de" className="absolute bottom-4 right-4 z-10 text-slate-400 text-xs bg-slate-800/80 px-3 py-2 rounded">
        Right-click + drag to pan • Scroll to zoom
      </div>

      {/* SVG Map Container */}
      <div data-ev-id="ev_b459e5af1a"
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>

        {isInitialized &&
        <svg data-ev-id="ev_c3aa54c320"
        width="100%"
        height="100%"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}>

            {Object.values(gameState.countries).map((country) => {
            const player = country.ownerId ? gameState.players[country.ownerId] : null;
            return (
              <HexTile
                key={country.id}
                country={country}
                player={player}
                isSelected={country.id === selectedCountryId}
                isAttackTarget={attackTargetIds.includes(country.id)}
                isCurrentPlayerOwned={country.ownerId === currentPlayerId}
                onClick={() => onSelectCountry(country.id)}
                showDetails={showDetails} />);


          })}
          </svg>
        }
      </div>
    </div>);

}

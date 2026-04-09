// Hex Grid Component with Pan & Zoom
import { useRef, useState, useCallback, useEffect } from 'react';
import type { GameState } from '@/types/game';
import { HexTile } from '@/components/game/HexTile';
import { hexToPixel, HEX_SIZE } from '@/utils/hexUtils';

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

  // Calculate actual bounds from countries
  const countries = Object.values(gameState.countries);
  let minX = Infinity,minY = Infinity,maxX = -Infinity,maxY = -Infinity;
  countries.forEach((country) => {
    const { x, y } = hexToPixel(country.coord);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const padding = HEX_SIZE * 1.5;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  const mapWidth = maxX - minX;
  const mapHeight = maxY - minY;

  // Center map on initial load
  useEffect(() => {
    const centerMap = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const scaleX = rect.width / mapWidth;
        const scaleY = rect.height / mapHeight;
        const initialScale = Math.min(scaleX, scaleY, 2) * 0.9;

        // Center the map
        const scaledWidth = mapWidth * initialScale;
        const scaledHeight = mapHeight * initialScale;
        const offsetX = (rect.width - scaledWidth) / 2 - minX * initialScale;
        const offsetY = (rect.height - scaledHeight) / 2 - minY * initialScale;

        setTransform({ x: offsetX, y: offsetY, scale: initialScale });
        setShowDetails(initialScale > 0.4);
        setIsInitialized(true);
      }
    };

    const timer = setTimeout(centerMap, 100);
    return () => clearTimeout(timer);
  }, [mapWidth, mapHeight, minX, minY]);

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

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
      const newScale = Math.min(scaleX, scaleY, 2) * 0.9;

      const scaledWidth = mapWidth * newScale;
      const scaledHeight = mapHeight * newScale;
      const offsetX = (rect.width - scaledWidth) / 2 - minX * newScale;
      const offsetY = (rect.height - scaledHeight) / 2 - minY * newScale;

      setTransform({ x: offsetX, y: offsetY, scale: newScale });
      setShowDetails(newScale > 0.4);
    }
  };

  return (
    <div data-ev-id="ev_f825096ef0" className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Zoom Controls */}
      <div data-ev-id="ev_2dc56717ce" className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button data-ev-id="ev_aa679783db"
        onClick={zoomIn}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          +
        </button>
        <button data-ev-id="ev_231fbe7c21"
        onClick={zoomOut}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          −
        </button>
        <button data-ev-id="ev_9711bc4d22"
        onClick={fitMap}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
        title="Fit map to view">

          ⊡
        </button>
      </div>

      {/* Instructions */}
      <div data-ev-id="ev_b614150581" className="absolute bottom-4 right-4 z-10 text-slate-400 text-xs bg-slate-800/80 px-3 py-2 rounded">
        Right-click + drag to pan • Scroll to zoom
      </div>

      {/* SVG Map Container */}
      <div data-ev-id="ev_899ba16e28"
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>

        {isInitialized &&
        <svg data-ev-id="ev_037e797436"
        width="100%"
        height="100%"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}>

            {countries.map((country) => {
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

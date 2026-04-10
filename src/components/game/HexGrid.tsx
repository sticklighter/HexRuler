// Hex Grid Component with Pan & Zoom
import { useRef, useState, useEffect } from 'react';
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, transformX: 0, transformY: 0 });
  const transformRef = useRef(transform);
  const [showDetails, setShowDetails] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Keep transformRef in sync
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Calculate actual bounds from countries
  const countries = Object.values(gameState.countries);
  let minX = Infinity,minY = Infinity,maxX = -Infinity,maxY = -Infinity;
  countries.forEach((country) => {
    const { x, y } = hexToPixel(country.coord);
    minX = Math.min(minX, x - HEX_SIZE);
    minY = Math.min(minY, y - HEX_SIZE);
    maxX = Math.max(maxX, x + HEX_SIZE);
    maxY = Math.max(maxY, y + HEX_SIZE);
  });

  const padding = HEX_SIZE;
  const boundsMinX = minX - padding;
  const boundsMinY = minY - padding;
  const boundsMaxX = maxX + padding;
  const boundsMaxY = maxY + padding;
  const mapWidth = boundsMaxX - boundsMinX;
  const mapHeight = boundsMaxY - boundsMinY;

  // Center map on initial load
  useEffect(() => {
    const centerMap = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const scaleX = rect.width / mapWidth;
        const scaleY = rect.height / mapHeight;
        const initialScale = Math.min(scaleX, scaleY, 2) * 0.85;

        // Center the map properly
        const offsetX = rect.width / 2 - (boundsMinX + mapWidth / 2) * initialScale;
        const offsetY = rect.height / 2 - (boundsMinY + mapHeight / 2) * initialScale;

        const newTransform = { x: offsetX, y: offsetY, scale: initialScale };
        setTransform(newTransform);
        transformRef.current = newTransform;
        setShowDetails(initialScale > 0.4);
        setIsInitialized(true);
      }
    };

    const timer = setTimeout(centerMap, 150);
    return () => clearTimeout(timer);
  }, [mapWidth, mapHeight, boundsMinX, boundsMinY]);

  // All mouse/wheel handlers in a single effect with no transform dependencies
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wheel zoom handler
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

    // Mouse down handler for right-click drag
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          transformX: transformRef.current.x,
          transformY: transformRef.current.y
        };
        container.style.cursor = 'grabbing';
      }
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newTransform = {
        x: dragStartRef.current.transformX + deltaX,
        y: dragStartRef.current.transformY + deltaY,
        scale: transformRef.current.scale
      };
      setTransform(newTransform);
      transformRef.current = newTransform;
    };

    // Mouse up handler
    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.style.cursor = 'grab';
      }
    };

    // Prevent context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Add all event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []); // Empty dependencies - handlers use refs

  // Zoom controls
  const zoomIn = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTransform((prev) => {
      const newScale = Math.min(prev.scale * 1.3, 4);
      const scaleChange = newScale / prev.scale;
      const newTransform = {
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
        scale: newScale
      };
      transformRef.current = newTransform;
      setShowDetails(newScale > 0.4);
      return newTransform;
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
      const newTransform = {
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
        scale: newScale
      };
      transformRef.current = newTransform;
      setShowDetails(newScale > 0.4);
      return newTransform;
    });
  };

  const fitMap = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = rect.width / mapWidth;
      const scaleY = rect.height / mapHeight;
      const newScale = Math.min(scaleX, scaleY, 2) * 0.85;

      const offsetX = rect.width / 2 - (boundsMinX + mapWidth / 2) * newScale;
      const offsetY = rect.height / 2 - (boundsMinY + mapHeight / 2) * newScale;

      const newTransform = { x: offsetX, y: offsetY, scale: newScale };
      setTransform(newTransform);
      transformRef.current = newTransform;
      setShowDetails(newScale > 0.4);
    }
  };

  return (
    <div data-ev-id="ev_46180164c6" className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Zoom Controls */}
      <div data-ev-id="ev_dac7e9e23a" className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button data-ev-id="ev_1b5fac71b5"
        onClick={zoomIn}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          +
        </button>
        <button data-ev-id="ev_e1f74ca121"
        onClick={zoomOut}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          −
        </button>
        <button data-ev-id="ev_28dc546235"
        onClick={fitMap}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
        title="Fit map to view">

          ⊡
        </button>
      </div>

      {/* SVG Map Container */}
      <div data-ev-id="ev_422edb8e21"
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: 'grab' }}>

        {isInitialized &&
        <svg data-ev-id="ev_bb73ab924f"
        ref={svgRef}
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

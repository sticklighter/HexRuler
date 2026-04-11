// Hex Grid Component with Pan & Zoom
import { useRef, useState, useEffect, useCallback } from 'react';
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
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 800 });
  const [showDetails, setShowDetails] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Drag state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const viewBoxRef = useRef(viewBox);

  // Keep viewBoxRef in sync
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Calculate map bounds
  const countries = Object.values(gameState.countries);
  let minX = Infinity,minY = Infinity,maxX = -Infinity,maxY = -Infinity;
  countries.forEach((country) => {
    const { x, y } = hexToPixel(country.coord);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  const padding = HEX_SIZE * 2;
  const mapMinX = minX - padding;
  const mapMinY = minY - padding;
  const mapMaxX = maxX + padding;
  const mapMaxY = maxY + padding;
  const mapWidth = mapMaxX - mapMinX;
  const mapHeight = mapMaxY - mapMinY;

  // Initialize viewBox to fit the map
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Calculate scale to fit the map with some padding
      const scaleX = mapWidth / rect.width;
      const scaleY = mapHeight / rect.height;
      const scale = Math.max(scaleX, scaleY) * 1.1;

      const vbWidth = rect.width * scale;
      const vbHeight = rect.height * scale;
      const vbX = mapMinX + mapWidth / 2 - vbWidth / 2;
      const vbY = mapMinY + mapHeight / 2 - vbHeight / 2;

      const newViewBox = { x: vbX, y: vbY, width: vbWidth, height: vbHeight };
      setViewBox(newViewBox);
      viewBoxRef.current = newViewBox;
      setShowDetails(scale < 2);
      setIsInitialized(true);
    }
  }, [mapMinX, mapMinY, mapWidth, mapHeight, isInitialized]);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Right click or middle click to pan
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      // Add move/up handlers to document
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        moveEvent.preventDefault();

        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();

        const dx = moveEvent.clientX - lastMouseRef.current.x;
        const dy = moveEvent.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };

        // Convert pixel delta to viewBox delta
        const vb = viewBoxRef.current;
        const scaleX = vb.width / rect.width;
        const scaleY = vb.height / rect.height;

        const newViewBox = {
          ...vb,
          x: vb.x - dx * scaleX,
          y: vb.y - dy * scaleY
        };
        setViewBox(newViewBox);
        viewBoxRef.current = newViewBox;
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  // Wheel zoom handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const vb = viewBoxRef.current;
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;

      // Mouse position in SVG coordinates
      const svgX = vb.x + mouseX / rect.width * vb.width;
      const svgY = vb.y + mouseY / rect.height * vb.height;

      // New dimensions
      const newWidth = Math.max(100, Math.min(vb.width * zoomFactor, mapWidth * 3));
      const newHeight = Math.max(100, Math.min(vb.height * zoomFactor, mapHeight * 3));

      // Adjust position to keep mouse point stationary
      const newX = svgX - mouseX / rect.width * newWidth;
      const newY = svgY - mouseY / rect.height * newHeight;

      const newViewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
      setViewBox(newViewBox);
      viewBoxRef.current = newViewBox;

      const scale = newWidth / rect.width;
      setShowDetails(scale < 2);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mapWidth, mapHeight]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Zoom controls
  const zoomIn = () => {
    const vb = viewBoxRef.current;
    const newWidth = vb.width * 0.7;
    const newHeight = vb.height * 0.7;
    const newX = vb.x + (vb.width - newWidth) / 2;
    const newY = vb.y + (vb.height - newHeight) / 2;
    const newViewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
    setViewBox(newViewBox);
    viewBoxRef.current = newViewBox;

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setShowDetails(newWidth / rect.width < 2);
    }
  };

  const zoomOut = () => {
    const vb = viewBoxRef.current;
    const newWidth = Math.min(vb.width * 1.3, mapWidth * 3);
    const newHeight = Math.min(vb.height * 1.3, mapHeight * 3);
    const newX = vb.x - (newWidth - vb.width) / 2;
    const newY = vb.y - (newHeight - vb.height) / 2;
    const newViewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
    setViewBox(newViewBox);
    viewBoxRef.current = newViewBox;

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setShowDetails(newWidth / rect.width < 2);
    }
  };

  const fitMap = () => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scaleX = mapWidth / rect.width;
    const scaleY = mapHeight / rect.height;
    const scale = Math.max(scaleX, scaleY) * 1.1;

    const vbWidth = rect.width * scale;
    const vbHeight = rect.height * scale;
    const vbX = mapMinX + mapWidth / 2 - vbWidth / 2;
    const vbY = mapMinY + mapHeight / 2 - vbHeight / 2;

    const newViewBox = { x: vbX, y: vbY, width: vbWidth, height: vbHeight };
    setViewBox(newViewBox);
    viewBoxRef.current = newViewBox;
    setShowDetails(scale < 2);
  };

  return (
    <div data-ev-id="ev_45c5b28723" className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Zoom Controls */}
      <div data-ev-id="ev_d434fe5992" className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button data-ev-id="ev_bcfb6b8479"
        onClick={zoomIn}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          +
        </button>
        <button data-ev-id="ev_1df160b57a"
        onClick={zoomOut}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-xl font-bold transition-colors">

          −
        </button>
        <button data-ev-id="ev_d043db1f32"
        onClick={fitMap}
        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
        title="Fit map to view">

          ⊡
        </button>
      </div>

      {/* SVG Map */}
      <div data-ev-id="ev_8ef53c2446"
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}>

        {isInitialized &&
        <svg data-ev-id="ev_6c311b5589"
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet">

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

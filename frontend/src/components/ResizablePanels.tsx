import React, { useRef, useCallback, useEffect, useState } from 'react';

interface ResizablePanelsProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number; // 0-1, default split position
  minLeftWidth?: number;
  minRightWidth?: number;
  storageKey?: string;
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  left,
  right,
  defaultRatio = 0.62,
  minLeftWidth = 360,
  minRightWidth = 280,
  storageKey = 'panel-split-ratio',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getInitialRatio = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return parseFloat(saved);
    } catch (_) {}
    return defaultRatio;
  };

  const [ratio, setRatio] = useState<number>(getInitialRatio);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, ratio.toString());
    } catch (_) {}
  }, [ratio, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const containerWidth = container.width;
      const mouseX = e.clientX - container.left;

      // Clamp within min widths
      const minLeft = minLeftWidth / containerWidth;
      const minRight = minRightWidth / containerWidth;
      const newRatio = Math.max(minLeft, Math.min(1 - minRight, mouseX / containerWidth));

      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minLeftWidth, minRightWidth]);

  const leftPercent = `${(ratio * 100).toFixed(2)}%`;
  const rightPercent = `${((1 - ratio) * 100).toFixed(2)}%`;

  return (
    <div className="resizable-panels" ref={containerRef}>
      <div className="resizable-left" style={{ width: leftPercent }}>
        {left}
      </div>

      {/* Draggable divider */}
      <div
        className="resizable-divider"
        onMouseDown={handleMouseDown}
        title="Drag to resize panels"
        aria-label="Resize panel divider"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="resizable-divider-line" />
        <div className="resizable-divider-handle">
          <div className="divider-dots" />
          <div className="divider-dots" />
          <div className="divider-dots" />
        </div>
      </div>

      <div className="resizable-right" style={{ width: rightPercent }}>
        {right}
      </div>
    </div>
  );
};

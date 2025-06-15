import React, { useEffect, useRef } from 'react';
import type { Action, IconItem, IconTexture } from '@/types';
import { useMinecraftItems } from '@/hooks/useMinecraftItems';
import { useAvatarStore } from '@/store/avatarStore';

interface ActionWheelVisualizerProps {
  actions: Action[];
  onSelectAction: (index: number) => void;
  onAddAction: () => void;
  selectedActionIndex: number | null;
  wheelTitle: string;
}

const WHEEL_RADIUS = 140; // in px
const BUTTON_SIZE = 64; // in px
const MAX_ACTIONS = 8;

/**
 * Calculates the angles for actions on the wheel based on the total number of actions.
 * - 1 action: on the right.
 * - 2 actions: first on right, second on left.
 * - 3+ actions: distributed evenly clockwise, starting from the top.
 * @param numActions The total number of actions to position.
 * @returns An array of angles in radians.
 */
const getActionAngles = (numActions: number): number[] => {
  if (numActions <= 0) {
    return [];
  }
  if (numActions === 1) {
    // Right
    return [0];
  }
  if (numActions === 2) {
    // Right, then Left
    return [0, Math.PI];
  }

  // 3 or more actions: distribute evenly, starting from top.
  const angles: number[] = [];
  const angleStep = (2 * Math.PI) / numActions;
  const startAngle = -Math.PI / 2 + (angleStep / 2); // Start from the top plus angleStep

  for (let i = 0; i < numActions; i++) {
    angles.push(startAngle + i * angleStep);
  }
  return angles;
};

function RenderIcon({icon}: {icon: IconItem | IconTexture}) {
    const { items } = useMinecraftItems();
    if (icon.type === 'item') {
      const item = items?.[icon.id];
      if (item?.imageUrl) {
          return <img src={item.imageUrl} alt={""} className="w-8 h-8 image-pixelated" />
      }
      return <span className="text-xs max-w-full break-words" style={{ lineHeight: 1 }}>{icon.id}</span>;
    }

    if (icon.type === 'texture') {
      return <RenderTextureIcon icon={icon} />
    }
    // Fallback for unknown icon type
    return <span className="text-xs max-w-full break-words" style={{ lineHeight: 1 }}>...</span>;
}

function RenderTextureIcon({icon}: {icon: IconTexture}) {
    const { textures } = useAvatarStore();
    const textureAsset = textures.find(t => t.name === icon.file);
    const { u, v, width, height, scale } = icon;
    const canvas = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        // Ensure the canvas element and texture asset are available
        if (!canvas.current || !textureAsset?.url) {
            return;
        }

        const context = canvas.current.getContext('2d');
        if (!context) {
            return;
        }

        // To prevent errors if the component unmounts while the image is loading
        let isCancelled = false;

        const image = new Image();
        // This is important for images served from other domains to avoid canvas tainting
        image.crossOrigin = "anonymous";
        image.src = textureAsset.url;
        
        image.onload = () => {
            if (isCancelled) {
                return;
            }

            // For pixel-perfect rendering, disable image smoothing
            context.imageSmoothingEnabled = false;

            // Clear the canvas before drawing
            context.clearRect(0, 0, canvas.current!.width, canvas.current!.height);

            // Draw the specific part of the texture onto the canvas, scaled up
            context.drawImage(
                image,        // The source image
                u,            // Source X (sx)
                v,            // Source Y (sy)
                width,        // Source Width (sWidth)
                height,       // Source Height (sHeight)
                0,            // Destination X (dx)
                0,            // Destination Y (dy)
                width * scale, // Destination Width (dWidth)
                height * scale // Destination Height (dHeight)
            );
        };

        // Cleanup function to run if the component unmounts or dependencies change
        return () => {
            isCancelled = true;
        };

    }, [textureAsset, u, v, width, height, scale]); // Re-run effect if these change

    if (!textureAsset) {
        return <span className="text-xl text-rose-400">?</span>;
    }
    
    return (
        <canvas
            width={width * scale}
            height={height * scale}
            ref={canvas}
            role="img"
            aria-label={`Texture from ${icon.file}`}
        />
    );
}

export function ActionWheelVisualizer({
  actions,
  onSelectAction,
  onAddAction,
  selectedActionIndex,
  wheelTitle,
}: ActionWheelVisualizerProps) {
  const numActions = actions.length;
  
  const actionAngles = getActionAngles(numActions);

  return (
    <div
      className="relative flex items-center justify-center bg-slate-800/50 rounded-full ring-4 ring-slate-700"
      style={{ width: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, height: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, margin: '0 auto' }}
    >
      {/* Central Hub */}
      <div className="flex flex-col items-center justify-center text-center w-36">
        <h4 className="font-bold text-lg text-white truncate" title={wheelTitle}>{wheelTitle}</h4>
        <p className="text-sm text-slate-400">{numActions} / {MAX_ACTIONS} Actions</p>
      </div>

      {/* Action Buttons */}
      {actions.map((action, index) => {
        const angle = actionAngles[index];
        const x = WHEEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS * Math.sin(angle);
        const isSelected = selectedActionIndex === index;

        return (
          // Container for the button and its label, positioned on the wheel
          <div
            key={action.uuid}
            className="absolute transition-all duration-200"
            style={{
              width: `${BUTTON_SIZE}px`,
              height: `${BUTTON_SIZE}px`,
              top: `calc(50% - ${BUTTON_SIZE / 2}px)`,
              left: `calc(50% - ${BUTTON_SIZE / 2}px)`,
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <button
              onClick={() => onSelectAction(index)}
              className={`w-full h-full flex items-center justify-center rounded-full text-white p-1 text-center leading-tight transition-all duration-200 ease-in-out transform focus:outline-none shadow-md hover:shadow-lg ${isSelected ? 'ring-4 ring-violet-500 shadow-xl z-10' : 'ring-2 ring-slate-600'}`}
              style={{
                backgroundColor: `rgb(${action.color.join(',')})`,
              }}
              title={action.label}
            >
              <RenderIcon icon={action.icon} />
            </button>
            {/* Position label absolutely below the button's container */}
            <span
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-semibold text-white truncate w-24 text-center pointer-events-none"
              title={action.label}
            >
              {action.label}
            </span>
          </div>
        );
      })}

      {/* Add Action Button in the next empty slot */}
      {numActions < MAX_ACTIONS && (() => {
        const addActionAngles = getActionAngles(numActions + 1);
        const angle = addActionAngles[numActions];
        const x = WHEEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS * Math.sin(angle);

        return (
            <button
                onClick={onAddAction}
                className="absolute flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-4xl transition-all duration-200 ease-in-out transform focus:outline-none ring-2 ring-emerald-700/50 shadow-md"
                style={{
                  width: `${BUTTON_SIZE}px`,
                  height: `${BUTTON_SIZE}px`,
                  top: `calc(50% - ${BUTTON_SIZE / 2}px)`,
                  left: `calc(50% - ${BUTTON_SIZE / 2}px)`,
                  transform: `translate(${x}px, ${y}px)`,
                }}
                title="Add new action"
            >
                +
            </button>
        );
      })()}
    </div>
  );
}
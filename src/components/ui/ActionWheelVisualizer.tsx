import React from 'react';
import type { Action } from '../../types';
import { useMinecraftItems } from '../../hooks/useMinecraftItems';

interface ActionWheelVisualizerProps {
  actions: Action[];
  onSelectAction: (index: number) => void;
  onAddAction: () => void;
  selectedActionIndex: number | null;
  wheelTitle: string;
  maxActions?: number;
}

const WHEEL_RADIUS = 140; // in px
const BUTTON_SIZE = 64; // in px
const MAX_ACTIONS = 8;

export function ActionWheelVisualizer({
  actions,
  onSelectAction,
  onAddAction,
  selectedActionIndex,
  wheelTitle,
}: ActionWheelVisualizerProps) {
  const { items } = useMinecraftItems();
  const angleStep = (2 * Math.PI) / MAX_ACTIONS;

  const renderIcon = (action: Action) => {
    const item = items?.[action.icon];
    if (item?.imageUrl) {
        return <img src={item.imageUrl} alt={action.label} className="w-8 h-8 image-pixelated" />
    }
    // Fallback for if item not found
    return <span className="text-xs max-w-full break-words" style={{ lineHeight: 1 }}>{action.icon}</span>;
  };

  return (
    <div
      className="relative flex items-center justify-center bg-slate-800/50 rounded-full ring-4 ring-slate-700"
      style={{ width: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, height: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, margin: '0 auto' }}
    >
      {/* Central Hub */}
      <div className="flex flex-col items-center justify-center text-center w-36">
        <h4 className="font-bold text-lg text-white truncate" title={wheelTitle}>{wheelTitle}</h4>
        <p className="text-sm text-slate-400">{actions.length} / {MAX_ACTIONS} Actions</p>
      </div>

      {/* Action Buttons */}
      {actions.map((action, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const x = WHEEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS * Math.sin(angle);
        const isSelected = selectedActionIndex === index;

        return (
          // Container for the button and its label, positioned on the wheel
          <div
            key={index}
            className="absolute"
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
              className={`w-full h-full flex items-center justify-center rounded-full text-white p-1 text-center leading-tight transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none shadow-md hover:shadow-lg ${isSelected ? 'ring-4 ring-violet-500 shadow-xl z-10' : 'ring-2 ring-slate-600'}`}
              style={{
                backgroundColor: `rgb(${action.color.join(',')})`,
              }}
              title={action.label}
            >
              {renderIcon(action)}
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
      {actions.length < MAX_ACTIONS && (() => {
        const index = actions.length;
        const angle = index * angleStep - Math.PI / 2;
        const x = WHEEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS * Math.sin(angle);

        return (
            <button
                onClick={onAddAction}
                className="absolute flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-4xl transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none ring-2 ring-emerald-700/50 shadow-md"
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
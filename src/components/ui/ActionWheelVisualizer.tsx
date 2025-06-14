import React from 'react';
import type { Action } from '../../types';

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
  const angleStep = (2 * Math.PI) / MAX_ACTIONS;

  return (
    <div
      className="relative flex items-center justify-center bg-gray-900/70 rounded-full border-4 border-gray-700"
      style={{ width: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, height: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`, margin: '0 auto' }}
    >
      {/* Central Hub */}
      <div className="flex flex-col items-center justify-center text-center w-36">
        <h4 className="font-bold text-lg text-white truncate" title={wheelTitle}>{wheelTitle}</h4>
        <p className="text-sm text-gray-400">{actions.length} / {MAX_ACTIONS} Actions</p>
      </div>

      {/* Action Buttons */}
      {actions.map((action, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const x = WHEEL_RADIUS * Math.cos(angle);
        const y = WHEEL_RADIUS * Math.sin(angle);
        const isSelected = selectedActionIndex === index;

        return (
          <button
            key={index}
            onClick={() => onSelectAction(index)}
            className={`absolute flex items-center justify-center rounded-full text-white text-3xl transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none ${isSelected ? 'ring-4 ring-blue-500 shadow-lg z-10' : 'ring-2 ring-gray-600'}`}
            style={{
              width: `${BUTTON_SIZE}px`,
              height: `${BUTTON_SIZE}px`,
              backgroundColor: `rgb(${action.color.join(',')})`,
              top: `calc(50% - ${BUTTON_SIZE / 2}px)`,
              left: `calc(50% - ${BUTTON_SIZE / 2}px)`,
              transform: `translate(${x}px, ${y}px)`,
            }}
            title={action.icon}
          >
            {action.icon}
          </button>
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
                className="absolute flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white text-4xl transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none ring-2 ring-green-800"
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
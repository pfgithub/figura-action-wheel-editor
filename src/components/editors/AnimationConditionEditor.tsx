import React from "react";
import type { AnimationCondition, ToggleGroup, UUID } from "../../types";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";

interface AnimationConditionEditorProps {
  condition: AnimationCondition;
  updateCondition: (c: AnimationCondition) => void;
  deleteCondition: () => void;
  allToggleGroups: ToggleGroup[];
}

export function AnimationConditionEditor({
  condition,
  updateCondition,
  deleteCondition,
  allToggleGroups,
}: AnimationConditionEditorProps) {
  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as AnimationCondition['kind'];
    let newCondition: AnimationCondition;
    if (kind === 'and' || kind === 'or') {
      newCondition = { kind, conditions: [] };
    } else if (kind === 'not') {
      newCondition = { kind };
    } else if (kind === 'toggleGroup') {
      newCondition = { kind, toggleGroup: allToggleGroups[0]?.uuid ?? '' as UUID, value: allToggleGroups[0]?.options[0] ?? '' };
    } else if (kind === 'player') {
      newCondition = { kind: 'player', player: 'walking' };
    } else {
      newCondition = { kind: 'empty' };
    }
    updateCondition(newCondition);
  };

  const renderConditionBody = () => {
    switch (condition.kind) {
      case 'empty': return null;
      case 'and':
      case 'or':
        return (
          <div className="pl-4 border-l-2 border-gray-600 space-y-2">
            {condition.conditions.map((cond, i) => (
              <AnimationConditionEditor
                key={i}
                condition={cond}
                updateCondition={(newCond) => {
                  const newConditions = [...condition.conditions];
                  newConditions[i] = newCond;
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                deleteCondition={() => {
                  const newConditions = condition.conditions.filter((_, idx) => idx !== i);
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                allToggleGroups={allToggleGroups}
              />
            ))}
            <Button
              onClick={() => {
                const newConditions = [...condition.conditions, { kind: 'empty' } as AnimationCondition];
                updateCondition({ ...condition, conditions: newConditions });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add Condition
            </Button>
          </div>
        );
      case 'not':
        return (
          <div className="pl-4 border-l-2 border-gray-600">
            {
              condition.condition ?
              <AnimationConditionEditor
                condition={condition.condition}
                updateCondition={(newCond) => updateCondition({ ...condition, condition: newCond })}
                deleteCondition={() => updateCondition({ ...condition, condition: {kind: "empty"} })}
                allToggleGroups={allToggleGroups}
              /> : 
              <Button
                onClick={() => updateCondition({ ...condition, condition: {kind: "empty"} })}
                className="bg-green-600 hover:bg-green-700"
              >
                + Add Condition
              </Button>
            }
          </div>
        );
      case 'toggleGroup': {
        const selectedGroup = allToggleGroups.find(g => g.uuid === condition.toggleGroup);
        return (
          <div className="flex gap-2">
            <Select
              value={condition.toggleGroup}
              onChange={(e) => updateCondition({ ...condition, toggleGroup: e.target.value as UUID, value: '' })}
              disabled={allToggleGroups.length === 0}
            >
              {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
            </Select>
            <Select
              value={condition.value}
              onChange={(e) => updateCondition({ ...condition, value: e.target.value })}
              disabled={!selectedGroup}
            >
              {selectedGroup?.options.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
        );
      }
      case 'player':
        return (
          <Select value={condition.player} onChange={(e) => updateCondition({ ...condition, player: e.target.value as any })}>
            {["crouching", "sprinting", "blocking", "fishing", "sleeping", "swimming", "flying", "walking"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
      <div className="flex gap-2 items-center mb-2">
        <Select value={condition.kind} onChange={handleKindChange} className="w-auto flex-grow">
          <option value="empty">Choose</option>
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
          <option value="toggleGroup">Toggle Group</option>
          <option value="player">Player State</option>
        </Select>
        <Button onClick={deleteCondition} className="bg-red-600 hover:bg-red-700">✕</Button>
      </div>
      {renderConditionBody()}
    </div>
  );
}
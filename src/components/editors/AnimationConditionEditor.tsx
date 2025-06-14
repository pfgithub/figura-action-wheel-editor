import React from "react";
import type { AnimationCondition, ToggleGroup, UUID } from "../../types";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";

interface AnimationConditionEditorProps {
  condition: AnimationCondition;
  updateCondition: (c: AnimationCondition) => void;
  deleteCondition: () => void;
  allToggleGroups: ToggleGroup[];
  isRoot?: boolean;
}

// Style mapping to provide a unique look for each condition type
// and to ensure Tailwind CSS picks up the class names.
const kindStyles: { [key in AnimationCondition['kind']]: { label: string; border: string; bg: string; text: string; selectBg: string } } = {
  empty: { label: '-- Select Condition Type --', border: 'border-gray-600', bg: 'bg-gray-800/50', text: 'text-gray-400', selectBg: 'bg-gray-700' },
  and: { label: 'AND (All Of)', border: 'border-blue-500', bg: 'bg-blue-900/20', text: 'text-blue-300', selectBg: 'bg-blue-900/50' },
  or: { label: 'OR (Any Of)', border: 'border-green-500', bg: 'bg-green-900/20', text: 'text-green-300', selectBg: 'bg-green-900/50' },
  not: { label: 'NOT', border: 'border-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-300', selectBg: 'bg-yellow-900/50' },
  toggleGroup: { label: 'Toggle Group State', border: 'border-purple-500', bg: 'bg-purple-900/20', text: 'text-purple-300', selectBg: 'bg-purple-900/50' },
  player: { label: 'Player State', border: 'border-pink-500', bg: 'bg-pink-900/20', text: 'text-pink-300', selectBg: 'bg-pink-900/50' },
};

export function AnimationConditionEditor({
  condition,
  updateCondition,
  deleteCondition,
  allToggleGroups,
  isRoot = false,
}: AnimationConditionEditorProps) {

  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as AnimationCondition['kind'];
    let newCondition: AnimationCondition;
    if (kind === 'and' || kind === 'or') {
      newCondition = { kind, conditions: [{ kind: 'empty' }] };
    } else if (kind === 'not') {
      newCondition = { kind, condition: { kind: 'empty' } };
    } else if (kind === 'toggleGroup') {
      const firstGroup = allToggleGroups[0];
      newCondition = { 
        kind, 
        toggleGroup: firstGroup?.uuid ?? '' as UUID, 
        value: firstGroup?.options[0] ?? '' 
      };
    } else if (kind === 'player') {
      newCondition = { kind: 'player', player: 'walking' };
    } else {
      newCondition = { kind: 'empty' };
    }
    updateCondition(newCondition);
  };

  const styles = kindStyles[condition.kind];

  const renderConditionBody = () => {
    switch (condition.kind) {
      case 'empty':
        return (
          <div className="text-center text-gray-400 py-3">
            <p>Select a condition type to begin.</p>
          </div>
        );

      case 'and':
      case 'or':
        return (
          <div className="space-y-3 pt-2">
            <div className={`space-y-3 pl-4 border-l-2 ${styles.border.replace('500', '600')}/70`}>
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
                    if (condition.conditions.length === 1) {
                      updateCondition({ kind: 'empty' });
                    } else {
                      const newConditions = condition.conditions.filter((_, idx) => idx !== i);
                      updateCondition({ ...condition, conditions: newConditions });
                    }
                  }}
                  allToggleGroups={allToggleGroups}
                />
              ))}
              <Button
                onClick={() => {
                  const newConditions = [...condition.conditions, { kind: 'empty' } as AnimationCondition];
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                className="bg-green-600 hover:bg-green-700 text-xs"
              >
                + Add Sub-Condition
              </Button>
            </div>
          </div>
        );

      case 'not':
        return (
          <div className="space-y-3 pt-2">
            <div className={`pl-4 border-l-2 ${styles.border.replace('500', '600')}/70`}>
              {condition.condition && (
                 <AnimationConditionEditor
                    condition={condition.condition}
                    updateCondition={(newCond) => updateCondition({ ...condition, condition: newCond })}
                    deleteCondition={() => updateCondition({ ...condition, condition: {kind: "empty"} })}
                    allToggleGroups={allToggleGroups}
                />
              )}
            </div>
          </div>
        );

      case 'toggleGroup': {
        const selectedGroup = allToggleGroups.find(g => g.uuid === condition.toggleGroup);
        return (
          <div className="flex items-center gap-2 text-gray-300 p-2 text-sm flex-wrap">
            <span>When</span>
            <Select
              value={condition.toggleGroup}
              onChange={(e) => {
                const newGroupUUID = e.target.value as UUID;
                const newGroup = allToggleGroups.find(g => g.uuid === newGroupUUID);
                updateCondition({ ...condition, toggleGroup: newGroupUUID, value: newGroup?.options[0] ?? '' });
              }}
              disabled={allToggleGroups.length === 0}
              className="w-auto flex-grow bg-gray-800"
            >
              {allToggleGroups.length === 0 && <option>No Toggle Groups</option>}
              {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
            </Select>
            <span className="font-semibold">is</span>
            <Select
              value={condition.value}
              onChange={(e) => updateCondition({ ...condition, value: e.target.value })}
              disabled={!selectedGroup}
              className="w-auto flex-grow bg-gray-800"
            >
              {selectedGroup?.options.map(o => <option key={o} value={o}>{o}</option>)}
              {!selectedGroup && <option>--</option>}
            </Select>
          </div>
        );
      }
      
      case 'player':
        return (
          <div className="flex items-center gap-2 text-gray-300 p-2 text-sm flex-wrap">
            <span>When player is</span>
            <Select 
              value={condition.player} 
              onChange={(e) => updateCondition({ ...condition, player: e.target.value as any })}
              className="w-auto flex-grow bg-gray-800"
            >
              {["crouching", "sprinting", "blocking", "fishing", "sleeping", "swimming", "flying", "walking"].map(p => 
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              )}
            </Select>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${styles.border} ${styles.bg} space-y-2`}>
      <div className="flex justify-between items-center gap-2">
        <Select 
            value={condition.kind} 
            onChange={handleKindChange} 
            className={`w-full font-semibold border-none text-white ${styles.selectBg}`}
        >
          <option value="empty">{kindStyles.empty.label}</option>
          <option value="and">{kindStyles.and.label}</option>
          <option value="or">{kindStyles.or.label}</option>
          <option value="not">{kindStyles.not.label}</option>
          <option value="toggleGroup">{kindStyles.toggleGroup.label}</option>
          <option value="player">{kindStyles.player.label}</option>
        </Select>
        {isRoot ? (
            condition.kind !== 'empty' && (
              <Button onClick={deleteCondition} className="bg-gray-600 hover:bg-gray-700 text-xs flex-shrink-0">
                Clear Condition
              </Button>
            )
        ) : (
            <Button onClick={deleteCondition} className="bg-red-600 hover:bg-red-700 text-white font-mono w-7 h-7 flex items-center justify-center p-0 rounded-full flex-shrink-0" aria-label="Delete condition">
                ✕
            </Button>
        )}
      </div>
      {renderConditionBody()}
    </div>
  );
}
import React from "react";
import type { AnimationCondition, Avatar, ToggleGroup, UUID } from "../../types";
import type { UpdateAvatarFn } from "../../hooks/useAvatar";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { ToggleGroupControls } from "../shared/ToggleGroupControls";

interface AnimationConditionEditorProps {
  condition: AnimationCondition;
  updateCondition: (c: AnimationCondition) => void;
  deleteCondition: () => void;
  allToggleGroups: ToggleGroup[];
  avatar: Avatar;
  updateAvatar: UpdateAvatarFn;
  isRoot?: boolean;
}

// Style mapping to provide a unique look for each condition type
// and to ensure Tailwind CSS picks up the class names.
const kindStyles: { [key in AnimationCondition['kind']]: { label: string; border: string; bg: string; text: string; selectBg: string } } = {
  empty: { label: '-- Select Condition Type --', border: 'border-slate-600', bg: 'bg-slate-800/50', text: 'text-slate-400', selectBg: 'bg-slate-700' },
  and: { label: 'AND (All Of)', border: 'border-sky-500', bg: 'bg-sky-900/30', text: 'text-sky-300', selectBg: 'bg-sky-900/50' },
  or: { label: 'OR (Any Of)', border: 'border-emerald-500', bg: 'bg-emerald-900/30', text: 'text-emerald-300', selectBg: 'bg-emerald-900/50' },
  not: { label: 'NOT', border: 'border-amber-500', bg: 'bg-amber-900/30', text: 'text-amber-300', selectBg: 'bg-amber-900/50' },
  toggleGroup: { label: 'Toggle Group State', border: 'border-violet-500', bg: 'bg-violet-900/30', text: 'text-violet-300', selectBg: 'bg-violet-900/50' },
  player: { label: 'Player State', border: 'border-rose-500', bg: 'bg-rose-900/30', text: 'text-rose-300', selectBg: 'bg-rose-900/50' },
};

export function AnimationConditionEditor({
  condition,
  updateCondition,
  deleteCondition,
  allToggleGroups,
  avatar,
  updateAvatar,
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
      const firstOptionId = firstGroup ? Object.keys(firstGroup.options)[0] as UUID : undefined;
      newCondition = { 
        kind, 
        toggleGroup: firstGroup?.uuid ?? '' as UUID, 
        value: (firstOptionId ?? '') as UUID
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
          <div className="text-center text-slate-400 py-3">
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
                  avatar={avatar}
                  updateAvatar={updateAvatar}
                />
              ))}
              <Button
                onClick={() => {
                  const newConditions = [...condition.conditions, { kind: 'empty' } as AnimationCondition];
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                className="bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-400 text-xs"
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
                    avatar={avatar}
                    updateAvatar={updateAvatar}
                />
              )}
            </div>
          </div>
        );

      case 'toggleGroup': {
        const selectedGroup = allToggleGroups.find(g => g.uuid === condition.toggleGroup);
        return (
          <div className="space-y-2 text-slate-300 p-2 text-sm">
            <div className="flex items-center gap-2">
                <span className="flex-shrink-0 pr-2">When</span>
                <div className="flex-grow">
                    <ToggleGroupControls
                        avatar={avatar}
                        updateAvatar={updateAvatar}
                        allToggleGroups={allToggleGroups}
                        selectedGroupUUID={condition.toggleGroup}
                        onGroupChange={(newUUID) => {
                            const newGroup = avatar.toggleGroups[newUUID];
                            const firstOptionId = newGroup ? Object.keys(newGroup.options)[0] as UUID : undefined;
                            updateCondition({ ...condition, toggleGroup: newUUID, value: (firstOptionId ?? '') as UUID });
                        }}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-semibold flex-shrink-0 pr-6">is</span>
                <Select
                    value={condition.value}
                    onChange={(e) => updateCondition({ ...condition, value: e.target.value as UUID })}
                    disabled={!selectedGroup}
                    className="w-auto flex-grow bg-slate-800/80"
                >
                    {selectedGroup && Object.entries(selectedGroup.options).map(([uuid, option]) => <option key={uuid} value={uuid}>{option.name}</option>)}
                    {!selectedGroup && <option>--</option>}
                </Select>
            </div>
          </div>
        );
      }
      
      case 'player':
        return (
          <div className="flex items-center gap-2 text-slate-300 p-2 text-sm flex-wrap">
            <span>When player is</span>
            <Select 
              value={condition.player} 
              onChange={(e) => updateCondition({ ...condition, player: e.target.value as any })}
              className="w-auto flex-grow bg-slate-800/80"
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
              <Button onClick={deleteCondition} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400 text-xs flex-shrink-0">
                Clear Condition
              </Button>
            )
        ) : (
            <Button onClick={deleteCondition} className="bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400 text-white font-black w-7 h-7 flex items-center justify-center p-0 rounded-full flex-shrink-0" aria-label="Delete condition">
                ✕
            </Button>
        )}
      </div>
      {renderConditionBody()}
    </div>
  );
}
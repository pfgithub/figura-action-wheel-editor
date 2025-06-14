import React from "react";
import type { ConditionalSetting, ToggleGroup, AnimationID } from "@/types";
import { AnimationConditionEditor } from "./AnimationConditionEditor";

interface AnimationSettingEditorProps {
  setting: ConditionalSetting;
  updateSetting: (s: ConditionalSetting) => void;
  allToggleGroups: ToggleGroup[];
  allAnimations: AnimationID[];
}

export function AnimationSettingEditor({ setting, updateSetting, allToggleGroups, allAnimations }: AnimationSettingEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm font-medium block mb-2">Activation Condition</label>
        <p className="text-slate-400 text-xs mb-3">This setting will be active when the following condition is true.</p>
        <div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
          <AnimationConditionEditor
            condition={setting.activationCondition}
            updateCondition={(newCond) => updateSetting({ ...setting, activationCondition: newCond })}
            allToggleGroups={allToggleGroups}
            allAnimations={allAnimations}
          />
        </div>
      </div>
    </div>
  );
}
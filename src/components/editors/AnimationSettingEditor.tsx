import React from "react";
import type { AnimationSetting, ToggleGroup } from "../../types";
import { AnimationConditionEditor } from "./AnimationConditionEditor";

interface AnimationSettingEditorProps {
  setting: AnimationSetting;
  updateSetting: (s: AnimationSetting) => void;
  allToggleGroups: ToggleGroup[];
}

export function AnimationSettingEditor({ setting, updateSetting, allToggleGroups }: AnimationSettingEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-sm font-medium block mb-2">Activation Condition</label>
        <div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
          <AnimationConditionEditor
            condition={setting.activationCondition}
            updateCondition={(newCond) => updateSetting({ ...setting, activationCondition: newCond })}
            allToggleGroups={allToggleGroups}
          />
        </div>
      </div>
    </div>
  );
}
import React from "react";
import type { AnimationID, AnimationSetting, ToggleGroup } from "../../types";
import { FormRow } from "../ui/FormRow";
import { Input } from "../ui/Input";
import { AnimationConditionEditor } from "./AnimationConditionEditor";

interface AnimationSettingEditorProps {
  animId: AnimationID;
  setting: AnimationSetting;
  updateSetting: (s: AnimationSetting) => void;
  allToggleGroups: ToggleGroup[];
}

export function AnimationSettingEditor({ animId, setting, updateSetting, allToggleGroups }: AnimationSettingEditorProps) {
  return (
    <div className="space-y-4">
      <FormRow label="Display Name">
        <Input type="text" value={setting.name} onChange={(e) => updateSetting({ ...setting, name: e.target.value })} />
      </FormRow>
      
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
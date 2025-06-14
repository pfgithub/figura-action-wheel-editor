import React from "react";
import type { AnimationID, AnimationSetting, ToggleGroup } from "../../types";
import { Button } from "../ui/Button";
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
        <label className="text-gray-400 text-sm font-bold block mb-2">Activation Condition</label>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
          {setting.activationCondition ? (
            <AnimationConditionEditor
              condition={setting.activationCondition}
              updateCondition={(newCond) => updateSetting({ ...setting, activationCondition: newCond })}
              deleteCondition={() => updateSetting({ ...setting, activationCondition: undefined })}
              allToggleGroups={allToggleGroups}
              isRoot={true}
            />
          ) : (
            <div className="text-center">
              <Button
                onClick={() => updateSetting({ ...setting, activationCondition: { kind: "empty" } })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Add Activation Condition
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
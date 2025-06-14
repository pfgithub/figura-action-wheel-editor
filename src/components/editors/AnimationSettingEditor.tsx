import React from "react";
import type { AnimationID, AnimationSetting, Avatar, ToggleGroup } from "../../types";
import type { UpdateAvatarFn } from "../../hooks/useAvatar";
import { Button } from "../ui/Button";
import { FormRow } from "../ui/FormRow";
import { Input } from "../ui/Input";
import { AnimationConditionEditor } from "./AnimationConditionEditor";

interface AnimationSettingEditorProps {
  animId: AnimationID;
  setting: AnimationSetting;
  updateSetting: (s: AnimationSetting) => void;
  allToggleGroups: ToggleGroup[];
  avatar: Avatar;
  updateAvatar: UpdateAvatarFn;
}

export function AnimationSettingEditor({ animId, setting, updateSetting, allToggleGroups, avatar, updateAvatar }: AnimationSettingEditorProps) {
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
            isRoot={true}
            avatar={avatar}
            updateAvatar={updateAvatar}
          />
        </div>
      </div>
    </div>
  );
}
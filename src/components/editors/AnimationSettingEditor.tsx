import React from "react";
import type { AnimationID, AnimationSetting, ToggleGroup } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
    <Card title={animId}>
      <FormRow label="Display Name">
        <Input type="text" value={setting.name} onChange={(e) => updateSetting({ ...setting, name: e.target.value })} />
      </FormRow>
      <FormRow label="Activation Condition">
        <div />
      </FormRow>
      {setting.activationCondition ? (
        <AnimationConditionEditor
          condition={setting.activationCondition}
          updateCondition={(newCond) => updateSetting({ ...setting, activationCondition: newCond })}
          deleteCondition={() => updateSetting({ ...setting, activationCondition: undefined })}
          allToggleGroups={allToggleGroups}
        />
      ) : (
        <Button
          onClick={() => updateSetting({ ...setting, activationCondition: { kind: "empty" } })}
          className="bg-green-600 hover:bg-green-700"
        >
          + Add Condition
        </Button>
      )}
    </Card>
  );
}
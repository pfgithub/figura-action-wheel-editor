import React from "react";
import type { ToggleGroup } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { FormRow } from "../ui/FormRow";
import { Input } from "../ui/Input";

interface ToggleGroupEditorProps {
    group: ToggleGroup;
    updateGroup: (g: ToggleGroup) => void;
    deleteGroup: () => void;
}

export function ToggleGroupEditor({ group, updateGroup, deleteGroup }: ToggleGroupEditorProps) {
  return (
    <Card
      title={<Input type="text" value={group.name} onChange={e => updateGroup({ ...group, name: e.target.value })} className="text-lg" />}
      controls={<Button onClick={deleteGroup} className="bg-red-600 hover:bg-red-700">Delete Group</Button>}
    >
      <FormRow label="Options">
        <div />
      </FormRow>
      <div className="space-y-2">
        {group.options.map((option, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...group.options];
                newOptions[i] = e.target.value;
                updateGroup({ ...group, options: newOptions });
              }}
            />
            <Button
              onClick={() => {
                const newOptions = group.options.filter((_, idx) => idx !== i);
                updateGroup({ ...group, options: newOptions });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              -
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={() => updateGroup({ ...group, options: [...group.options, `Option ${group.options.length + 1}`] })}
        className="bg-green-600 hover:bg-green-700">+ Add Option</Button>
    </Card>
  );
}
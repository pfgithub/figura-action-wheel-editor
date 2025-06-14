import React from "react";
import type { Action, ActionWheel, ToggleGroup, UUID } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { ActionEditor } from "./ActionEditor";

interface ActionWheelEditorProps {
    wheel: ActionWheel;
    updateWheel: (w: ActionWheel) => void;
    deleteWheel: () => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionWheelEditor({ wheel, updateWheel, deleteWheel, allToggleGroups, allActionWheels }: ActionWheelEditorProps) {
  const addAction = () => {
    const newAction: Action = {
      icon: '❓',
      color: [255, 255, 255],
      effect: { kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID },
    };
    updateWheel({ ...wheel, actions: [...wheel.actions, newAction] });
  };

  return (
    <Card
      title={<Input type="text" value={wheel.title} onChange={e => updateWheel({ ...wheel, title: e.target.value })} className="text-lg" />}
      controls={<Button onClick={deleteWheel} className="bg-red-600 hover:bg-red-700">Delete Wheel</Button>}
    >
      <div className="space-y-2">
        {wheel.actions.map((action, i) => (
          <ActionEditor
            key={i}
            action={action}
            updateAction={(newAction) => {
              const newActions = [...wheel.actions];
              newActions[i] = newAction;
              updateWheel({ ...wheel, actions: newActions });
            }}
            deleteAction={() => {
              const newActions = wheel.actions.filter((_, idx) => idx !== i);
              updateWheel({ ...wheel, actions: newActions });
            }}
            allToggleGroups={allToggleGroups}
            allActionWheels={allActionWheels}
          />
        ))}
      </div>
      <Button onClick={addAction} className="bg-green-600 hover:bg-green-700">+ Add Action</Button>
    </Card>
  );
}
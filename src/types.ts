export type UUID = string & {__is_uuid: true};
export type AnimationID = string & {__is_animation_id: true};

export type Avatar = {
    mainActionWheel?: UUID,
    actionWheels: Record<UUID, ActionWheel>,
    toggleGroups: Record<UUID, ToggleGroup>,
    conditionalSettings: Record<UUID, ConditionalSetting>,
};

export type ActionWheel = {
    uuid: UUID,
    title: string,
    actions: Action[],
};

export type Action = {
    icon: string,
    label: string,
    color: [number, number, number],
    effect?: ActionEffect,
};
export type ActionEffect = {
    kind: "toggle",
    toggleGroup?: UUID,
    value?: UUID,
} | {
    kind: "switchPage",
    actionWheel?: UUID,
};

export type ToggleGroupOption = {
    name: string;
};

export type ToggleGroup = {
    uuid: UUID,
    name:string,
    options: Record<UUID, ToggleGroupOption>,
};

export type PlayAnimationSetting = {
    uuid: UUID;
    kind: "play_animation";
    animation: AnimationID;
    activationCondition?: AnimationCondition;
};

export type HideElementSetting = {
    uuid: UUID;
    kind: "hide_element";
    element: string;
    activationCondition?: AnimationCondition;
};

export type HidePlayerSetting = {
    uuid: UUID;
    kind: "hide_player";
    activationCondition?: AnimationCondition;
};

export type ConditionalSetting = PlayAnimationSetting | HideElementSetting | HidePlayerSetting;

export type ConditionOr = {
    id: UUID,
    kind: "or",
    conditions: AnimationCondition[],
};
export type AnimationConditionAnd = {
    id: UUID,
    kind: "and",
    conditions: AnimationCondition[],
};
export type AnimationConditionNot = {
    id: UUID,
    kind: "not",
    condition?: AnimationCondition,
};
export type AnimationConditionToggleGroup = {
    id: UUID,
    kind: "toggleGroup",
    toggleGroup?: UUID,
    value?: UUID,
};
export type AnimationConditionPlayer = {
    id: UUID,
    kind: "player",
    player?: "crouching" | "sprinting" | "blocking" | "fishing" | "sleeping" | "swimming" | "flying" | "walking",
};
export type AnimationCondition = ConditionOr | AnimationConditionAnd | AnimationConditionNot | AnimationConditionToggleGroup | AnimationConditionPlayer;
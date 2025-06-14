export type UUID = string & {__is_uuid: true};
export type AnimationID = string & {__is_animation_id: true};

export type Avatar = {
    mainActionWheel: UUID,
    actionWheels: Record<UUID, ActionWheel>,
    toggleGroups: Record<UUID, ToggleGroup>,
    animationSettings: Record<AnimationID, AnimationSetting>,
    animations: AnimationID[],
};

export type ActionWheel = {
    uuid: UUID,
    title: string,
    actions: Action[],
};

export type Action = {
    icon: string,
    color: [number, number, number],
    effect: ActionEffect,
};
export type ActionEffect = {
    kind: "toggle",
    toggleGroup: UUID,
    value: string,
} | {
    kind: "switchPage",
    actionWheel: UUID,
};

export type ToggleGroup = {
    uuid: UUID,
    name: string,
    options: string[],
};

export type AnimationSetting = {
    name: string,
    activationCondition: AnimationCondition,
};

export type AnimationConditionOr = {
    kind: "or",
    conditions: AnimationCondition[],
};
export type AnimationConditionAnd = {
    kind: "and",
    conditions: AnimationCondition[],
};
export type AnimationConditionNot = {
    kind: "not",
    condition: AnimationCondition,
};
export type AnimationConditionToggleGroup = {
    kind: "toggleGroup",
    toggleGroup: UUID,
    value: string,
};
export type AnimationConditionPlayer = {
    kind: "player",
    player: "crouching" | "sprinting" | "blocking" | "fishing" | "sleeping" | "swimming" | "flying" | "walking",
};
export type AnimationCondition = AnimationConditionOr | AnimationConditionAnd | AnimationConditionNot | AnimationConditionToggleGroup | AnimationConditionPlayer;

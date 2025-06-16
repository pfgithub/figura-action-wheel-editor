export type UUID = string & {__is_uuid: true};
export type AnimationID = string & {__is_animation_id: true};
export type RenderSettingID = string & {__is_render_setting_id: true};
export type RenderValueID = string & {__is_render_value_id: true};

export type TextureAsset = {
    name: string;
    url: string; // Data URL
    width: number;
    height: number;
};

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

export type IconItem = {
    type: 'item';
    id: string;
};
export type IconTexture = {
    type: 'texture';
    file: string;
    u: number;
    v: number;
    width: number;
    height: number;
    scale: number;
};

export type Action = {
    uuid: UUID,
    icon: IconItem | IconTexture,
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
    activationCondition?: Condition;
};

export type HideElementSetting = {
    uuid: UUID;
    kind: "hide_element";
    element: string;
    activationCondition?: Condition;
};

export type RenderSetting = {
    uuid: UUID;
    kind: "render";
    render: RenderSettingID,
    activationCondition?: Condition;
};

export type ConditionalSetting = PlayAnimationSetting | HideElementSetting | RenderSetting;

export type ConditionOr = {
    id: UUID,
    kind: "or",
    conditions: Condition[],
};
export type ConditionAnd = {
    id: UUID,
    kind: "and",
    conditions: Condition[],
};
export type ConditionNot = {
    id: UUID,
    kind: "not",
    condition?: Condition,
};
export type ConditionToggleGroup = {
    id: UUID,
    kind: "toggleGroup",
    toggleGroup?: UUID,
    value?: UUID,
};
export type ConditionRender = {
    id: UUID,
    kind: "render",
    render?: RenderValueID,
};
export type ConditionAnimation = {
    id: UUID,
    kind: "animation",
    animation?: AnimationID,
    mode?: "STOPPED" | "PAUSED" | "PLAYING",
};
export type ConditionCustom = {
    id: UUID,
    kind: "custom",
    expression?: string,
};

export type Condition = ConditionOr | ConditionAnd | ConditionNot | ConditionToggleGroup | ConditionRender | ConditionAnimation | ConditionCustom;

export type RenderSettingData = {
    id: RenderSettingID,
    name: string,
};
export type RenderValueData = {
    id: RenderValueID,
    name: string,
};

export type MinecraftItem = {
    id: string;
    name: string;
    image: Image;
};
export type Image = {
    uuid: string,
    alt: string,
    width: number,
    height: number,
    thumbhash: string,
};
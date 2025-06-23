export type UUID = string & { __is_uuid: true };
export type RenderSettingID = string & { __is_render_setting_id: true };
export type RenderValueID = string & { __is_render_value_id: true };

export type AnimationRef = {
	model: string;
	animation: string;
};

export type ModelPartRef = {
	model: string;
	partPath: string[];
};

export type TextureAsset = {
	name: string;
	url: string; // Data URL
	width: number;
	height: number;
};

export type AvatarMetadata = {
	name?: string;
	description?: string;
	author?: string; // Will be ignored if authors is present
	authors?: string[];
	version?: string;
	color?: string; // hex string without #
	autoScripts?: string[];
	autoAnims?: AnimationRef[];
	ignoredTextures?: string[];
	customizations?: Record<string, Customization>;
};

export type Customization = {
	primaryRenderType?: string;
	secondaryRenderType?: string;
	parentType?: string;
	moveTo?: ModelPartRef;
	visible?: boolean;
	remove?: boolean;
	smooth?: boolean;
};

export type Avatar = {
	mainActionWheel?: UUID;
	actionWheels: Record<UUID, ActionWheel>;
	conditionalSettings: Record<UUID, ConditionalSetting>;
	scripts: Record<UUID, Script>;
	keybinds: Record<UUID, Keybind>;
};

export type Keybind = {
	uuid: UUID;
	name: string;
	keyId: string;
	effect?: ActionEffect;
};

export type KeybindListItem = {
	name: string;
	id: string;
};

export type ActionWheel = {
	uuid: UUID;
	title: string;
	actions: Action[];
};

export type IconItem = {
	type: "item";
	id: string;
};
export type IconTexture = {
	type: "texture";
	file: string;
	u: number;
	v: number;
	width: number;
	height: number;
	scale: number;
};

export type Action = {
	uuid: UUID;
	icon: IconItem | IconTexture;
	label: string;
	color: [number, number, number];
	effect?: ActionEffect;
};
export type ActionEffect =
	| {
			id: UUID;
			kind: "switchPage";
			actionWheel?: UUID;
	  }
	| {
			id: UUID;
			kind: "scriptAction";
			scriptInstance?: UUID;
			scriptAction?: UUID;
	  }
	| {
			id: UUID;
			kind: "toggle";
			targetType?: "animation" | "modelPart";
			animation?: AnimationRef;
			modelPart?: ModelPartRef;
			exclusiveTags?: UUID[];
			isSaved?: boolean;
			defaultOn?: boolean;
	  };

export type HideElementSetting = {
	uuid: UUID;
	kind: "hide_element";
	element: ModelPartRef;
	activationCondition?: Condition;
};

export type RenderSetting = {
	uuid: UUID;
	kind: "render";
	render: RenderSettingID;
	activationCondition?: Condition;
};

export type ScriptSetting = {
	uuid: UUID;
	kind: "script";
	scriptInstance: UUID;
	setting: UUID;
	activationCondition?: Condition;
};

export type ConditionalSetting =
	| HideElementSetting
	| RenderSetting
	| ScriptSetting;

export type ConditionOr = {
	id: UUID;
	kind: "or";
	conditions: Condition[];
};
export type ConditionAnd = {
	id: UUID;
	kind: "and";
	conditions: Condition[];
};
export type ConditionNot = {
	id: UUID;
	kind: "not";
	condition?: Condition;
};
export type ConditionRender = {
	id: UUID;
	kind: "render";
	render?: RenderValueID;
};
export type ConditionAnimation = {
	id: UUID;
	kind: "animation";
	animation?: AnimationRef;
	mode: "PLAYING" | "PAUSED" | "STOPPED";
};
export type ConditionScript = {
	id: UUID;
	kind: "script";
	scriptInstance?: UUID;
	condition?: UUID;
};

export type Condition =
	| ConditionOr
	| ConditionAnd
	| ConditionNot
	| ConditionRender
	| ConditionAnimation
	| ConditionScript;

export type RenderSettingData = {
	id: RenderSettingID;
	name: string;
};
export type RenderValueData = {
	id: RenderValueID;
	name: string;
};

export type MinecraftItem = {
	id: string;
	name: string;
	image: Image;
};
export type Image = {
	uuid: string;
	alt: string;
	width: number;
	height: number;
	thumbhash: string;
};

// --- Scripts ---

export type Script = {
	uuid: UUID;
	data: ScriptData;
	name: string;
	instances: Record<UUID, ScriptInstance[]>;
};

export type ScriptInstance = {
	uuid: UUID;
	name: string;
	parameterValue: unknown;
};

export type ScriptData = {
	uuid: UUID;
	name: string;
	instanceTypes: Record<UUID, ScriptDataInstanceType>;
};

export type ScriptDataInstanceType = {
	uuid: UUID;
	name: string;
	mode: "zero_or_one" | "one" | "many";
	parameters: ScriptDataInstanceParameter[];
	defines: {
		conditions: Record<UUID, ScriptDataCondition>;
		settings: Record<UUID, ScriptDataSetting>;
		action: Record<UUID, ScriptDataAction>;
	};
};
export type ScriptDataCondition = {
	uuid: UUID;
	name: string;
};
export type ScriptDataSetting = {
	uuid: UUID;
	name: string;
};
export type ScriptDataAction = {
	uuid: UUID;
	name: string;
};

export type ScriptDataInstanceParameter = {
	uuid: UUID;
	name: string;
	type: LuaType;
	defaultValue?: unknown;
	helpText?: string;
};

export type LuaType =
	| {
			kind: "table";
			entries: Record<string, LuaType>;
	  }
	| {
			kind: "list";
			child: LuaType;
	  }
	| {
			kind: "boolean";
	  }
	| {
			kind: "vec3";
	  }
	| {
			kind: "string";
	  }
	| {
			kind: "ModelPart";
	  }
	| {
			kind: "ActionWheel";
	  }
	| {
			kind: "Animation";
	  }
	| {
			kind: "item";
	  };
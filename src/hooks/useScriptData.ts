import { useMemo } from "react";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	Script,
	ScriptDataInstanceType,
	ScriptInstance,
	UUID,
} from "@/types";

export type DefineKind = keyof ScriptDataInstanceType["defines"];

export interface ScriptInstanceDetails {
	instance: ScriptInstance;
	script: Script;
	type: ScriptDataInstanceType;
}

/**
 * A hook that returns all script instances that provide a specific kind of "define" (e.g., 'action', 'settings').
 * @param kind The kind of define to filter by.
 * @returns An array of detailed script instances.
 */
export function useScriptInstancesWithDefine(
	kind: DefineKind,
): ScriptInstanceDetails[] {
	const scripts = useAvatarStore((state) => state.avatar?.scripts ?? {});

	return useMemo(() => {
		const instancesWithDefine: ScriptInstanceDetails[] = [];
		if (!scripts) {
			return instancesWithDefine;
		}

		for (const script of Object.values(scripts)) {
			for (const [typeUuid, instances] of Object.entries(script.instances)) {
				const type = script.data.instanceTypes[typeUuid as UUID];
				if (
					type?.defines?.[kind] &&
					Object.keys(type.defines[kind]).length > 0
				) {
					for (const instance of instances) {
						instancesWithDefine.push({ instance, script, type });
					}
				}
			}
		}
		return instancesWithDefine;
	}, [scripts, kind]);
}

/**
 * A hook that returns a map of all script instances, keyed by their UUID.
 * Useful for efficient lookups of instance details.
 * @returns A Map where keys are instance UUIDs and values are their details.
 */
export function useScriptInstanceMap(): Map<UUID, ScriptInstanceDetails> {
	const scripts = useAvatarStore((state) => state.avatar?.scripts ?? {});

	return useMemo(() => {
		const map = new Map<UUID, ScriptInstanceDetails>();
		if (!scripts) {
			return map;
		}

		for (const script of Object.values(scripts)) {
			for (const [typeUuid, instances] of Object.entries(script.instances)) {
				const type = script.data.instanceTypes[typeUuid as UUID];
				if (type) {
					for (const instance of instances) {
						map.set(instance.uuid, { instance, script, type });
					}
				}
			}
		}
		return map;
	}, [scripts]);
}

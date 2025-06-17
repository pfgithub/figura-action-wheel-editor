import type { UUID } from "@/types";

export const generateUUID = (): UUID => crypto.randomUUID() as UUID;

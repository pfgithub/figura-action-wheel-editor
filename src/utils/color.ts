// src/utils/color.ts
export const rgbToHex = (r: number, g: number, b: number): string => {
	return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

export const hexToRgb = (hex: string): [number, number, number] | null => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
			]
		: null;
};

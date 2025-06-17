// src/components/ui/ColorPicker.tsx
import React from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Popover, Transition } from "@headlessui/react";
import { rgbToHex, hexToRgb } from "@/utils/color";

interface ColorPickerProps {
	color: [number, number, number];
	onChange: (color: [number, number, number]) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
	const hexColor = rgbToHex(...color);

	const handleHexChange = (newHex: string) => {
		const rgb = hexToRgb(newHex);
		if (rgb) {
			onChange(rgb);
		}
	};

	return (
		<div className="flex items-center gap-3">
			<Popover className="relative">
				<Popover.Button
					className="w-10 h-10 rounded-md border-2 border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900"
					style={{ backgroundColor: hexColor }}
				/>
				<Transition
					as={React.Fragment}
					enter="transition ease-out duration-200"
					enterFrom="opacity-0 translate-y-1"
					enterTo="opacity-100 translate-y-0"
					leave="transition ease-in duration-150"
					leaveFrom="opacity-100 translate-y-0"
					leaveTo="opacity-0 translate-y-1"
				>
					<Popover.Panel className="absolute z-10 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
						<HexColorPicker color={hexColor} onChange={handleHexChange} />
					</Popover.Panel>
				</Transition>
			</Popover>
			<div className="relative">
				<span className="absolute left-3 inset-y-0 flex items-center text-slate-500">
					#
				</span>
				<HexColorInput
					color={hexColor}
					onChange={handleHexChange}
					className="w-28 bg-slate-800 border border-slate-700 rounded-md h-10 pl-7 font-mono text-sm tracking-wider"
					prefixed
				/>
			</div>
		</div>
	);
}

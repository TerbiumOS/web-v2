import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Compressor from "compressorjs";
import { getCroppedImg } from "../../utils/cropImage";

interface CropperModalProps {
	imageSrc: string;
	onSave: (croppedImageDataUrl: string) => void;
	onCancel: () => void;
}

export function CropperModal({ imageSrc, onSave, onCancel }: CropperModalProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);
	const handleSave = async () => {
		if (!croppedAreaPixels) return;
		try {
			const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
			new Compressor(croppedBlob, {
				quality: 0.5,
				success(result) {
					const reader = new FileReader();
					reader.readAsDataURL(result);
					reader.onload = () => {
						onSave(reader.result as string);
					};
				},
			});
		} catch (error) {
			console.error("Error cropping image:", error);
		}
	};
	return (
		<div className="w-screen h-screen fixed top-0 left-0 right-0 bottom-0 z-999999 bg-[#000000a6] flex flex-col justify-center items-center gap-[10px]">
			<div className="bg-[#ffffff0a] lg:w-[500px] lg:h-[500px] md:w-[400px] md:h-[400px] sm:w-[300px] sm:h-[300px] flex justify-center items-center rounded-[8px] overflow-hidden w-[500px] h-[500px] relative">
				<Cropper image={imageSrc} crop={crop} zoom={zoom} rotation={rotation} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onCropComplete} cropShape="round" showGrid={false} />
			</div>
			<div className="flex w-[500px] justify-between items-center">
				<button
					className="cancel broken_button cursor-pointer bg-[#1d1d1d] text-[#ffffff38] border-[#ffffff22] hover:bg-[#414141] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] h-[18px] rounded-[6px] transition duration-150"
					onClick={onCancel}
				>
					Cancel
				</button>
				<button
					className="save broken_button cursor-pointer bg-[#1d1d1d] text-[#ffffff38] border-[#ffffff22] hover:bg-[#414141] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] h-[18px] rounded-[6px] transition duration-150"
					onClick={handleSave}
				>
					Save
				</button>
			</div>
		</div>
	);
}

/**
 * Helper function to create a cropped image from source image and crop area
 * Based on react-easy-crop documentation
 */

export interface Area {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Creates a cropped image from the source image and crop area
 * @param imageSrc - Source image URL or base64 string
 * @param pixelCrop - Crop area in pixels
 * @param rotation - Rotation in degrees (default: 0)
 * @returns Promise that resolves to cropped image as Blob
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get canvas context");
	}
	const maxSize = Math.max(image.width, image.height);
	const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
	canvas.width = safeArea;
	canvas.height = safeArea;
	ctx.translate(safeArea / 2, safeArea / 2);
	ctx.rotate((rotation * Math.PI) / 180);
	ctx.translate(-safeArea / 2, -safeArea / 2);
	ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);
	const data = ctx.getImageData(0, 0, safeArea, safeArea);
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;
	ctx.putImageData(data, Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x), Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y));
	return new Promise((resolve, reject) => {
		canvas.toBlob(blob => {
			if (!blob) {
				reject(new Error("Canvas is empty"));
				return;
			}
			resolve(blob);
		}, "image/jpeg");
	});
}

/**
 * Helper to create an image element from a source
 */
function createImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", error => reject(error));
		image.setAttribute("crossOrigin", "anonymous");
		image.src = url;
	});
}

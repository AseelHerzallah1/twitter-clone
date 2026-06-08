const createImage = (url) =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.addEventListener("error", reject);
		image.setAttribute("crossOrigin", "anonymous");
		image.src = url;
	});

export const getCroppedImage = async (imageSrc, pixelCrop, mimeType = "image/jpeg") => {
	const image = await createImage(imageSrc);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height
	);

	return canvas.toDataURL(mimeType, 0.92);
};

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { IoClose } from "react-icons/io5";
import { getCroppedImage } from "../../utils/cropImage";
import LoadingSpinner from "./LoadingSpinner";

const ImageCropModal = ({ open, imageSrc, aspect, title, onComplete, onCancel }) => {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
	const [saving, setSaving] = useState(false);

	const onCropComplete = useCallback((_, pixels) => {
		setCroppedAreaPixels(pixels);
	}, []);

	const handleApply = async () => {
		if (!croppedAreaPixels) return;
		setSaving(true);
		try {
			const cropped = await getCroppedImage(imageSrc, croppedAreaPixels);
			onComplete(cropped);
		} finally {
			setSaving(false);
		}
	};

	if (!open || !imageSrc) return null;

	return (
		<div className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center'>
			<div className='absolute inset-0 bg-black/70' onClick={onCancel} />
			<div className='relative w-full max-w-lg bg-base-100 rounded-t-2xl sm:rounded-2xl border border-theme shadow-2xl overflow-hidden'>
				<div className='flex items-center justify-between px-4 py-3 border-b border-theme'>
					<h3 className='font-bold text-lg'>{title}</h3>
					<button
						type='button'
						onClick={onCancel}
						className='p-2 rounded-full hover-bg-theme transition-colors'
						aria-label='Close crop editor'
					>
						<IoClose className='w-5 h-5' />
					</button>
				</div>

				<div className='relative w-full h-72 sm:h-80 bg-base-200'>
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={aspect}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={onCropComplete}
					/>
				</div>

				<div className='px-4 py-3 border-t border-theme'>
					<label className='text-sm text-muted-theme mb-1 block'>Zoom</label>
					<input
						type='range'
						min={1}
						max={3}
						step={0.05}
						value={zoom}
						onChange={(e) => setZoom(Number(e.target.value))}
						className='range range-primary range-xs w-full'
					/>
				</div>

				<div className='flex justify-end gap-2 px-4 pb-4'>
					<button type='button' className='btn btn-ghost rounded-full btn-sm' onClick={onCancel}>
						Cancel
					</button>
					<button
						type='button'
						className='btn btn-primary rounded-full btn-sm text-white px-5'
						onClick={handleApply}
						disabled={saving}
					>
						{saving ? <LoadingSpinner size='sm' /> : "Apply"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ImageCropModal;

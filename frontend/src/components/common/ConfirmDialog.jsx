const ConfirmDialog = ({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) => (
	<dialog open className='modal modal-open'>
		<div className='modal-box max-w-sm rounded-2xl border border-theme'>
			<h3 className='font-bold text-lg'>{title}</h3>
			<p className='py-3 text-[15px] text-muted-theme'>{message}</p>
			<div className='flex gap-2 justify-end mt-2'>
				<button type='button' className='btn btn-ghost rounded-full' onClick={onCancel}>
					Cancel
				</button>
				<button type='button' className='btn bg-red-500 hover:bg-red-600 text-white border-none rounded-full' onClick={onConfirm}>
					{confirmLabel}
				</button>
			</div>
		</div>
		<form method='dialog' className='modal-backdrop'>
			<button onClick={onCancel}>close</button>
		</form>
	</dialog>
);

export default ConfirmDialog;

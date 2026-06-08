const NestMessage = ({ content, className = "" }) => {
	if (!content) return null;

	const parts = content.split(/(\*\*[^*]+\*\*)/g);

	return (
		<span className={className}>
			{parts.map((part, i) =>
				part.startsWith("**") && part.endsWith("**") ? (
					<strong key={i} className='font-bold'>{part.slice(2, -2)}</strong>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</span>
	);
};

export default NestMessage;

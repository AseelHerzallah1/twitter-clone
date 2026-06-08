import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const useStartConversation = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (userId) => {
			const res = await fetch("/api/messages/conversation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to start conversation");
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			navigate(`/messages?c=${data.conversationId}`);
		},
		onError: (error) => toast.error(error.message),
	});
};

export default useStartConversation;

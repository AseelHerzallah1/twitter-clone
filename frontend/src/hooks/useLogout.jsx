import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useLogout = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/auth/logout", { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: () => toast.error("Logout failed"),
	});
};

export default useLogout;

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
		mutationFn: async (formData) => {
			const res = await fetch("/api/users/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || data.message || "Failed to update profile");
			return data;
		},
		onSuccess: (data) => {
			if (data?.user) {
				const prev = queryClient.getQueryData(["authUser"]);
				queryClient.setQueryData(["authUser"], data.user);
				queryClient.setQueryData(["userProfile", data.user.username], (old) => ({
					...data.user,
					tweetsCount: old?.tweetsCount,
				}));
				if (prev?.username && prev.username !== data.user.username) {
					queryClient.removeQueries({ queryKey: ["userProfile", prev.username] });
				}
			}
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update profile");
		},
	});

	return { updateProfile, isUpdatingProfile };
};

export default useUpdateUserProfile;

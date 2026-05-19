import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useFollow = () => {
    const queryClient = useQueryClient();

    const {mutate: follow, isPending} = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: "POST",
                });
                const data = await res.json();
                if(!res.ok) throw new Error(data.message || "Failed to follow user");
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["suggestedUsers"]});
            queryClient.invalidateQueries({queryKey: ["notifications"]});
            queryClient.invalidateQueries({queryKey: ["userProfile"]});
        },
        onError: (error) => {
            toast.error(error.message || "Failed to follow user");
        }
    });
    return {follow, isPending};
};

export default useFollow;

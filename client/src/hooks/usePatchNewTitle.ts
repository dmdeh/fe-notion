import { useMutation, useQueryClient } from "@tanstack/react-query";
import requestAPI from "../utils/requestAPI";

export interface NewTitleMutate {
  newTitle: string;
}

export const usePatchNewTitle = (pageId: string = "") => {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async ({ newTitle }: NewTitleMutate) => {
      return await requestAPI(`pages/${pageId}`, "PATCH", { title: newTitle });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pages"] }),
  });
  return mutate;
};

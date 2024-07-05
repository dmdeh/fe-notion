import { useMutation, useQueryClient } from "@tanstack/react-query";
import requestAPI from "../utils/requestAPI";

interface BlockMutate {
  type: string;
  blockId?: string;
  newData: any;
}

const usePatchBlockData = (pageId: string = "") => {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async ({ type, blockId, newData }: BlockMutate) => {
      let endpoint;
      switch (type) {
        case "block":
          endpoint = `pages/${pageId}/blocks/${blockId}`;
          break;
        case "content":
          endpoint = `pages/${pageId}/blocks/${blockId}`;
          newData = { content: newData };
          break;
        case "order":
          endpoint = `pages/${pageId}/blocks`;
          newData = { blocks: newData };
          break;
        default:
          throw new Error("Invalid type");
      }
      return await requestAPI(endpoint, "PATCH", newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`pages/${pageId}`] });
    },
  });

  return mutate;
};

export default usePatchBlockData;

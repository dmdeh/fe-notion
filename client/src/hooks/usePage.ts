import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataType } from "../services/api";
import requestAPI from "../utils/requestAPI";

export const useGetPage = (endpoint: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => requestAPI(endpoint),
  });
  return { data, isLoading };
};

export const useCreateNewPage = () => {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (newData: DataType) => requestAPI("pages", "POST", newData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      return data; // 생성된 페이지 데이터를 반환해야 _id 받아올 수 있음
    },
  });
  return mutate;
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async (pageId: string) => {
      return await requestAPI(`pages/${pageId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });
  return mutate;
};

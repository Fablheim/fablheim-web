import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi, type CreateFeedbackDto } from '@/api/feedback';

export function useMyFeedback() {
  return useQuery({
    queryKey: ['feedback', 'mine'],
    queryFn: feedbackApi.getMine,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateFeedbackDto) => feedbackApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'mine'] });
    },
  });
}

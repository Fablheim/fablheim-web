import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enemyTemplatesApi } from '@/api/enemy-templates';
import type {
  CreateEnemyTemplateRequest,
  UpdateEnemyTemplateRequest,
  SpawnEnemiesRequest,
} from '@/types/enemy-template';

export function useEnemyTemplates(filters?: {
  category?: string;
  tags?: string[];
}) {
  return useQuery({
    queryKey: ['enemy-templates', filters],
    queryFn: () => enemyTemplatesApi.list(filters),
  });
}

export function useEnemyTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['enemy-templates', id],
    queryFn: () => enemyTemplatesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateEnemyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEnemyTemplateRequest) =>
      enemyTemplatesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enemy-templates'] });
    },
  });
}

export function useUpdateEnemyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEnemyTemplateRequest }) =>
      enemyTemplatesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enemy-templates'] });
    },
  });
}

export function useDeleteEnemyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enemyTemplatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enemy-templates'] });
    },
  });
}

export function useSpawnEnemies() {
  return useMutation({
    mutationFn: ({ templateId, body }: { templateId: string; body: SpawnEnemiesRequest }) =>
      enemyTemplatesApi.spawn(templateId, body),
  });
}

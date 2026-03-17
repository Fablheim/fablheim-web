import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatureTemplatesApi } from '@/api/creature-templates';
import type {
  CreateCreatureTemplateRequest,
  UpdateCreatureTemplateRequest,
  SpawnCreaturesRequest,
} from '@/types/creature-template';

export function useCreatureTemplates(filters?: {
  category?: string;
  tags?: string[];
  scope?: string;
}) {
  return useQuery({
    queryKey: ['creature-templates', filters],
    queryFn: () => creatureTemplatesApi.list(filters),
  });
}

export function useCreatureTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['creature-templates', id],
    queryFn: () => creatureTemplatesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCreatureTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCreatureTemplateRequest) =>
      creatureTemplatesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creature-templates'] });
    },
  });
}

export function useUpdateCreatureTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCreatureTemplateRequest }) =>
      creatureTemplatesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creature-templates'] });
    },
  });
}

export function useDeleteCreatureTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creatureTemplatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creature-templates'] });
    },
  });
}

export function useSpawnCreatures() {
  return useMutation({
    mutationFn: ({ templateId, body }: { templateId: string; body: SpawnCreaturesRequest }) =>
      creatureTemplatesApi.spawn(templateId, body),
  });
}

// Backward-compat aliases
export const useEnemyTemplates = useCreatureTemplates;
export const useEnemyTemplate = useCreatureTemplate;
export const useCreateEnemyTemplate = useCreateCreatureTemplate;
export const useUpdateEnemyTemplate = useUpdateCreatureTemplate;
export const useDeleteEnemyTemplate = useDeleteCreatureTemplate;
export const useSpawnEnemies = useSpawnCreatures;

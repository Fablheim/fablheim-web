import { api } from './client';
import type {
  PartyRelationship,
  CreateRelationshipPayload,
  UpdateRelationshipPayload,
  AddRelationshipEventPayload,
} from '@/types/relationship';

export const relationshipsApi = {
  list: (campaignId: string) =>
    api.get<PartyRelationship[]>(`/campaigns/${campaignId}/relationships`).then((r) => r.data),

  create: (campaignId: string, data: CreateRelationshipPayload) =>
    api.post<PartyRelationship>(`/campaigns/${campaignId}/relationships`, data).then((r) => r.data),

  update: (campaignId: string, relationshipId: string, data: UpdateRelationshipPayload) =>
    api
      .patch<PartyRelationship>(`/campaigns/${campaignId}/relationships/${relationshipId}`, data)
      .then((r) => r.data),

  addEvent: (campaignId: string, relationshipId: string, data: AddRelationshipEventPayload) =>
    api
      .post<PartyRelationship>(
        `/campaigns/${campaignId}/relationships/${relationshipId}/events`,
        data,
      )
      .then((r) => r.data),

  remove: (campaignId: string, relationshipId: string) =>
    api.delete(`/campaigns/${campaignId}/relationships/${relationshipId}`).then((r) => r.data),
};

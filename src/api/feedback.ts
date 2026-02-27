import { api } from './client';

export interface CreateFeedbackDto {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  useCase?: string;
}

export interface FeedbackItem {
  _id: string;
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  status: 'new' | 'in_review' | 'planned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId: string | { _id: string; username: string; email: string; avatar: string };
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  useCase?: string;
  adminNotes?: string;
  assignedTo?: string | { _id: string; username: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const feedbackApi = {
  create: (dto: CreateFeedbackDto) =>
    api.post<FeedbackItem>('/feedback', dto).then((r) => r.data),

  getMine: () =>
    api.get<FeedbackItem[]>('/feedback/mine').then((r) => r.data),
};

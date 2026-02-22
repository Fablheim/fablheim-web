export interface TabSnapshot {
  title: string;
  path: string;
  icon?: string;
}

export interface Layout {
  _id: string;
  userId: string;
  campaignId?: string;
  name: string;
  description?: string;
  leftTabs: TabSnapshot[];
  activeLeftTabIndex: number;
  rightTabs: TabSnapshot[];
  activeRightTabIndex: number;
  rightPanelVisible: boolean;
  splitRatio: number;
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLayoutPayload {
  name: string;
  leftTabs: TabSnapshot[];
  activeLeftTabIndex: number;
  rightTabs: TabSnapshot[];
  activeRightTabIndex: number;
  rightPanelVisible: boolean;
  splitRatio: number;
  campaignId?: string;
  description?: string;
  isDefault?: boolean;
}

export type UpdateLayoutPayload = Partial<CreateLayoutPayload>;

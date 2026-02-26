export interface TabSnapshot {
  title: string;
  path: string;
  icon?: string;
}

export type LayoutType = 'tab' | 'mosaic';

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
  layoutType: LayoutType;
  stage?: 'prep' | 'live' | 'recap';
  mosaicTree?: Record<string, unknown>;
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
  layoutType?: LayoutType;
  stage?: 'prep' | 'live' | 'recap';
  mosaicTree?: Record<string, unknown>;
}

export type UpdateLayoutPayload = Partial<CreateLayoutPayload>;

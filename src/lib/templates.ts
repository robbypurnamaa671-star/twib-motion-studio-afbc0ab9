import { TopLayerTransform } from "./media";

export type LockSettings = {
  lockBottomPosition: boolean;
  lockBottomMedia: boolean;
  allowTopRotation: boolean;
  topMinScale: number;
  topMaxScale: number;
};

export const DEFAULT_LOCK_SETTINGS: LockSettings = {
  lockBottomPosition: true,
  lockBottomMedia: true,
  allowTopRotation: true,
  topMinScale: 0.1,
  topMaxScale: 5,
};

export type SharedTemplate = {
  id: string;
  owner_id: string;
  title: string;
  slug?: string | null;
  canvas_ratio: string;
  canvas_w: number;
  canvas_h: number;
  bottom_layer_url: string;
  bottom_layer_config: TopLayerTransform;
  top_layer_config: Record<string, unknown>;
  lock_settings: LockSettings;
  created_at: string;
  expires_at: string | null;
};

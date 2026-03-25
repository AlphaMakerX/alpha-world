import { MAP_HEIGHT, MAP_WIDTH } from "./constants";

/** 与场景边界一致（同 {@link MAP_WIDTH} / {@link MAP_HEIGHT}）。 */
export const MAP_MAX_X = MAP_WIDTH;
export const MAP_MAX_Y = MAP_HEIGHT;

export const POSITION_SYNC_INTERVAL_MS = 2000;
export const POSITION_MIN_DISTANCE_TO_SYNC = 20;

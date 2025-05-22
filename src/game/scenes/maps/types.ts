import type Phaser from "phaser";

export interface MapObstacleState {
  spinningRects: { body: MatterJS.BodyType; speed: number }[];
  spinningCrosses: { bars: MatterJS.BodyType[]; speed: number }[];
  spinningTriangles: { body: MatterJS.BodyType; speed: number }[];
  pins: MatterJS.BodyType[];
  crossBars: MatterJS.BodyType[];
  walls: MatterJS.BodyType[];
}

export const createDefaultObstacles = (): MapObstacleState => ({
  spinningRects: [],
  spinningCrosses: [],
  spinningTriangles: [],
  pins: [],
  crossBars: [],
  walls: [],
});

export interface MapBuilderContext {
  scene: Phaser.Scene;
  matter: Phaser.Physics.Matter.MatterPhysics;
  leftX: number;
  rightX: number;
  width: number;
  worldSize: { width: number; height: number };
  ballRadius: number;
  obstacles: MapObstacleState;
}

export type MapBuilder = (ctx: MapBuilderContext) => void;
export type UpdateBuilder = (
  ctx: MapBuilderContext,
  scene: Phaser.Scene
) => void;

export interface IGameMap {
  build(): void;
}

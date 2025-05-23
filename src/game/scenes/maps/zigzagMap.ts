import type { MapBuilder, IGameMap } from "./types.ts";
import {
  addPins,
  addSpinningRect,
  addSpinningCross,
  addTriangles,
} from "./obstacleUtils.ts";

class ZigzagMap implements IGameMap {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  makeWalls() {
    const ctx = this.ctx;
    // 좌우 벽 생성 (기본)
    const wallLeft = ctx.matter.add.rectangle(
      ctx.leftX - 20,
      ctx.worldSize.height / 2,
      40,
      ctx.worldSize.height,
      { isStatic: true }
    );
    const wallRight = ctx.matter.add.rectangle(
      ctx.rightX + 20,
      ctx.worldSize.height / 2,
      40,
      ctx.worldSize.height,
      { isStatic: true }
    );
    ctx.obstacles.walls.push(wallLeft, wallRight);
    // 지그재그 벽 생성
    for (let i = 0; i < 6; i++) {
      const y = 600 + i * 800;
      const x = i % 2 === 0 ? ctx.leftX + 100 : ctx.rightX - 100;
      const angle = i % 2 === 0 ? 0.2 : -0.2;
      const wall = ctx.matter.add.rectangle(x, y, 300, 30, {
        isStatic: true,
        angle,
      });
      ctx.obstacles.walls.push(wall);
    }
  }

  build() {
    this.makeWalls();
    const ctx = this.ctx;
    // 핀을 지그재그로 배치
    for (let i = 0; i < 6; i++) {
      const x = i % 2 === 0 ? ctx.leftX + 150 : ctx.rightX - 150;
      addPins(ctx, x, 4, 2, 800 + i * 800);
    }
    // 중간에 회전 장애물
    addSpinningCross(ctx, ctx.leftX + ctx.width / 2, 2500, 300, 20, 0.04);
    addSpinningRect(ctx, ctx.leftX + ctx.width / 2, 4000, 400, 20, -0.01);
    // 마지막에 삼각형 장애물
    addTriangles(ctx, ctx.leftX + ctx.width / 2, 3, 2, 6000, 0.05);
  }
}

const zigzagMap: MapBuilder = (ctx: any) => {
  new ZigzagMap(ctx).build();
};

export default zigzagMap;

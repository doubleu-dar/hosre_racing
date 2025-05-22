import type { MapBuilder, IGameMap } from "./types.ts";
import {
  addPins,
  addSpinningRect,
  addSpinningCross,
  addTriangles,
} from "./obstacleUtils.ts";

class DefaultMap implements IGameMap {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  makeWalls() {
    const ctx = this.ctx;
    const wallTickness = 200;
    const thinWallTickness = 20;

    const funnelLength = 300;
    const curveStartY = 3000;
    const curveEndY = 3500;
    const comebackCurveStartY = 4500;
    const comebackCurveEndY = 5000;
    const curveRad = Phaser.Math.DegToRad(-45);

    const leftWall = ctx.matter.add.rectangle(
      ctx.leftX - wallTickness / 2,
      ctx.worldSize.height / 2,
      wallTickness,
      ctx.worldSize.height,
      { isStatic: true }
    );
    const rightWall = ctx.matter.add.rectangle(
      ctx.rightX + wallTickness / 2,
      curveStartY / 2,
      wallTickness,
      curveStartY,
      { isStatic: true }
    );
    const rightCurveWall = ctx.matter.add.rectangle(
      ctx.rightX + ctx.width / 2,
      curveStartY + (curveEndY - curveStartY) / 2,
      thinWallTickness,
      (1 / Math.cos(curveRad)) * ctx.width,
      { isStatic: true, angle: curveRad }
    );
    // customTriangleWall2
    const holeWidth = ctx.ballRadius * 2 + 8;
    const baseX = Math.abs(Math.cos(curveRad) * ctx.width) + wallTickness;
    const baseY = Math.abs(Math.sin(curveRad) * ctx.width) + wallTickness;
    const curveLength = comebackCurveStartY - curveEndY;
    const triCenterX2 = ctx.leftX + baseX / 2 - 30;
    const triCenterY2 = curveStartY + (baseY + curveLength + baseY) / 2;
    const rightTrianglePoints2 = [
      { x: 0, y: 0 },
      { x: baseX, y: -baseY },
      { x: baseX, y: -(baseY + curveLength) },
      { x: 0, y: -(baseY + curveLength + baseY) },
    ];
    const customTriangleWall2 = ctx.matter.add.fromVertices(
      triCenterX2,
      triCenterY2,
      rightTrianglePoints2,
      { isStatic: true }
    );
    ctx.obstacles.walls.push(customTriangleWall2);
    // 나머지 벽
    const rightSecondWall = ctx.matter.add.rectangle(
      ctx.rightX + ctx.width + wallTickness / 2,
      curveEndY + (comebackCurveStartY - curveEndY) / 2,
      wallTickness,
      comebackCurveStartY - curveEndY,
      { isStatic: true }
    );
    const rightCurve2Wall = ctx.matter.add.rectangle(
      ctx.rightX + ctx.width / 2,
      comebackCurveStartY + (comebackCurveEndY - comebackCurveStartY) / 2,
      thinWallTickness,
      (1 / Math.cos(curveRad)) * ctx.width,
      { isStatic: true, angle: -curveRad }
    );
    const rightFinalWall = ctx.matter.add.rectangle(
      ctx.rightX + wallTickness / 2,
      comebackCurveEndY + (ctx.worldSize.height - comebackCurveEndY) / 2,
      wallTickness,
      ctx.worldSize.height - comebackCurveEndY,
      { isStatic: true }
    );
    ctx.obstacles.walls.push(
      leftWall,
      rightWall,
      rightCurveWall,
      rightSecondWall,
      rightCurve2Wall,
      rightFinalWall
    );
  }

  makeFunnels() {
    const ctx = this.ctx;
    const funnelRad = Phaser.Math.DegToRad(45);

    const startFunnel2Y = 2000;
    const funnel2Length = ((1 / Math.cos(funnelRad)) * ctx.width) / 4;
    const startFunnel3Y = 2000 + Math.sin(funnelRad) * funnel2Length * 3;

    const funnel2LeftGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.leftX + (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel2Y + (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );
    const funnel2CenterLeftGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.leftX +
        Math.cos(funnelRad) * funnel2Length * 2 -
        (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel2Y +
        Math.sin(funnelRad) * funnel2Length * 2 +
        (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    // 깔때기 사선 벽(오른쪽)
    const funnel2RightGuide = ctx.matter.add.rectangle(
      ctx.rightX - (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel2Y + (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    const funnel2CenterRightGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.rightX -
        Math.cos(funnelRad) * funnel2Length * 2 +
        (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel2Y +
        Math.sin(funnelRad) * funnel2Length * 2 +
        (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );

    // 깔때기 사선 벽(왼쪽)
    const funnel3LeftGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.leftX + (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel3Y + (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );
    const funnel3CenterLeftGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.leftX +
        Math.cos(funnelRad) * funnel2Length * 2 -
        (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel3Y +
        Math.sin(funnelRad) * funnel2Length * 2 +
        (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    // 깔때기 사선 벽(오른쪽)
    const funnel3RightGuide = ctx.matter.add.rectangle(
      ctx.rightX - (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel3Y + (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    const funnel3CenterRightGuide = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.rightX -
        Math.cos(funnelRad) * funnel2Length * 2 +
        (Math.cos(funnelRad) * funnel2Length) / 2,
      startFunnel3Y +
        Math.sin(funnelRad) * funnel2Length * 2 +
        (Math.sin(funnelRad) * funnel2Length) / 2,
      20,
      funnel2Length,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );
    ctx.obstacles.walls.push(
      funnel2LeftGuide,
      funnel2CenterLeftGuide,
      funnel2RightGuide,
      funnel2CenterRightGuide,
      funnel3LeftGuide,
      funnel3CenterLeftGuide,
      funnel3RightGuide,
      funnel3CenterRightGuide
    );
  }
  makeLastFunnel() {
    const ctx = this.ctx;
    const finalFunnelY = 6000;
    const funnelWall = 400;
    const funnelLastLength = 300;
    const funnelRad = Phaser.Math.DegToRad(45);
    // 깔때기 사선 벽(왼쪽)
    const lastFunnel = ctx.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      ctx.leftX + (Math.cos(funnelRad) * funnelLastLength) / 2,
      finalFunnelY + (Math.sin(funnelRad) * funnelLastLength) / 2,
      20,
      funnelLastLength,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );

    const funnelLeftWall = ctx.matter.add.rectangle(
      ctx.leftX + Math.cos(funnelRad) * funnelLastLength,
      finalFunnelY + Math.sin(funnelRad) * funnelLastLength + funnelWall / 2,
      20,
      funnelWall,
      {
        isStatic: true,
      }
    );

    // 깔때기 사선 벽(오른쪽)
    const rightFunnel = ctx.matter.add.rectangle(
      ctx.rightX - (Math.cos(funnelRad) * funnelLastLength) / 2,
      finalFunnelY + (Math.sin(funnelRad) * funnelLastLength) / 2,
      20,
      funnelLastLength,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    const funnelRightWall = ctx.matter.add.rectangle(
      ctx.rightX - Math.cos(funnelRad) * funnelLastLength,
      finalFunnelY + Math.sin(funnelRad) * funnelLastLength + funnelWall / 2,
      20,
      funnelWall,
      {
        isStatic: true,
      }
    );

    ctx.obstacles.walls.push(
      lastFunnel,
      funnelLeftWall,
      rightFunnel,
      funnelRightWall
    );

    addSpinningRect(ctx, ctx.leftX, finalFunnelY + 450, 800, 20, -0.003);
  }

  build() {
    this.makeWalls();
    const ctx = this.ctx;
    const centerX = ctx.leftX + ctx.width / 2;
    addSpinningCross(ctx, ctx.leftX + (ctx.width / 4) * 1, 500, 250, 20, 0.03);
    addSpinningCross(ctx, ctx.leftX + (ctx.width / 4) * 3, 500, 250, 20, -0.03);
    addSpinningCross(ctx, ctx.leftX + ctx.width / 2, 750, 250, 20);
    addSpinningCross(
      ctx,
      ctx.leftX + (ctx.width / 4) * 1,
      1000,
      250,
      20,
      -0.03
    );
    addSpinningCross(ctx, ctx.leftX + (ctx.width / 4) * 3, 1000, 250, 20, 0.03);
    this.makeFunnels();
    addPins(ctx, centerX, 7, 3, 1500);
    addSpinningRect(
      ctx,
      ctx.rightX + (ctx.width / 3) * 1,
      3800,
      500,
      20,
      0.005
    );
    addSpinningRect(
      ctx,
      ctx.rightX + (ctx.width / 3) * 2,
      4200,
      500,
      20,
      -0.005
    );
    addSpinningRect(ctx, ctx.leftX + (ctx.width / 4) * 1, 5300, 400, 20, -0.01);

    addTriangles(ctx, centerX, 5, 5, 5500);
    this.makeLastFunnel();
  }
}

const defaultMap: MapBuilder = (ctx: any) => {
  new DefaultMap(ctx).build();
};

export default defaultMap;

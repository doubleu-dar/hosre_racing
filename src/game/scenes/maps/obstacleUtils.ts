import { MapBuilderContext } from "./types";

export function addPins(
  ctx: MapBuilderContext,
  centerX: number,
  _pinCount: number,
  pinRows: number,
  startY: number
) {
  for (let row = 0; row < pinRows; row++) {
    const pinCount = _pinCount + (row % 2 === 0 ? 1 : 0);
    const rowY = startY + row * 70;
    const spacing = 80;
    let startX = centerX - ((pinCount - 1) / 2) * spacing;
    for (let col = 0; col < pinCount; col++) {
      const x = startX + col * spacing;
      const y = rowY;
      const pin = ctx.matter.add.circle(x, y, 4, {
        isStatic: true,
        restitution: 1.2,
      });
      ctx.obstacles.pins.push(pin);
    }
  }
}

export function addSpinningRect(
  ctx: MapBuilderContext,
  crossX: number,
  crossY: number,
  width = 400,
  height = 20,
  speed = 0.005,
  initialAngle?: number
) {
  const angle =
    initialAngle !== undefined
      ? initialAngle
      : Phaser.Math.FloatBetween(0, Math.PI * 2);
  const crossBar1 = ctx.matter.add.rectangle(crossX, crossY, width, height, {
    isStatic: true,
    angle,
  });
  ctx.obstacles.spinningRects.push({ body: crossBar1, speed });
}

export function addSpinningCross(
  ctx: MapBuilderContext,
  crossX: number,
  crossY: number,
  width = 200,
  height = 20,
  speed = 0.03,
  initialAngle?: number
) {
  const angle =
    initialAngle !== undefined
      ? initialAngle
      : Phaser.Math.FloatBetween(0, Math.PI * 2);
  const crossBar1 = ctx.matter.add.rectangle(crossX, crossY, width, height, {
    isStatic: true,
    angle,
  });
  const crossBar2 = ctx.matter.add.rectangle(crossX, crossY, width, height, {
    isStatic: true,
    angle: angle + Phaser.Math.DegToRad(90),
  });
  ctx.obstacles.crossBars.push(crossBar1, crossBar2);
  ctx.obstacles.spinningCrosses.push({ bars: [crossBar1, crossBar2], speed });
}

export function addTriangles(
  ctx: MapBuilderContext,
  centerX: number,
  triangleCount: number,
  rows: number,
  startY: number,
  speed = 0.03
) {
  const triangleSize = 16;
  const height = (triangleSize * Math.sqrt(3)) / 2;
  for (let row = 0; row < rows; row++) {
    const count = triangleCount + (row % 2 === 0 ? 1 : 0);
    const rowY = startY + row * (height + 50);
    const spacing = 100;
    let startX = centerX - ((count - 1) / 2) * spacing;
    for (let col = 0; col < count; col++) {
      const x = startX + col * spacing;
      const y = rowY + 50;
      const points = [
        { x: 0, y: -height / 2 },
        { x: -triangleSize / 2, y: height / 2 },
        { x: triangleSize / 2, y: height / 2 },
      ];
      const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const randomSpeed = (Math.random() < 0.5 ? -1 : 1) * Math.abs(speed);
      const triangle = ctx.matter.add.fromVertices(x, y, points, {
        isStatic: true,
        angle: initialAngle,
      });
      ctx.obstacles.spinningTriangles.push({
        body: triangle,
        speed: randomSpeed,
      });
    }
  }
}

export function updateObstacles(ctx: MapBuilderContext, scene: Phaser.Scene) {
  const timeScale = scene.matter.world.engine.timing.timeScale || 1;
  // 십자 장애물 회전 (개별 속도)
  for (const cross of ctx.obstacles.spinningCrosses) {
    for (const bar of cross.bars) {
      scene.matter.body.setAngle(bar, bar.angle + cross.speed * timeScale);
    }
  }
  // 사각바 회전 장애물
  for (const rect of ctx.obstacles.spinningRects) {
    scene.matter.body.setAngle(
      rect.body,
      rect.body.angle + rect.speed * timeScale
    );
  }
  // 삼각형 회전 장애물
  for (const tri of ctx.obstacles.spinningTriangles) {
    scene.matter.body.setAngle(tri.body, tri.body.angle + tri.speed);
  }
}

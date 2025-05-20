import Phaser from "phaser";

export default class DropBallScene extends Phaser.Scene {
  private balls: Array<{ index: number; ball: MatterJS.BodyType }> = [];
  private pins: MatterJS.BodyType[] = [];
  private results: number[] = [];
  private ballCount: number = 10;
  // private pinCount: number = 6;
  private ballRadius: number = 20;
  private gameStarted: boolean = false;
  private worldSize = { width: 2400, height: 7000 };
  private crossBars: MatterJS.BodyType[] = [];
  private walls: MatterJS.BodyType[] = [];

  // 드래그 상태 변수 선언
  private _dragCamera: boolean = false;
  private _dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private _cameraStart: { x: number; y: number } = { x: 0, y: 0 };

  // 속도 감속 지역(Zone) 추가
  private slowZones: { x: number; y: number; width: number; height: number }[] =
    [];

  private worldCenterX = this.worldSize.width / 2;
  private width = 500;
  private leftX = this.worldCenterX - this.width / 2;
  private rightX = this.leftX + this.width;
  private funnelLength = 300;
  private curveStartY = 3000;
  private curveEndY = 3500;
  private comebackCurveStartY = 4500;
  private comebackCurveEndY = 5000;
  private funnelRad = Phaser.Math.DegToRad(45);
  private curveRad = Phaser.Math.DegToRad(-45);

  private startFunnel2Y = 2000;
  private funnel2Length = ((1 / Math.cos(this.funnelRad)) * this.width) / 4;
  private startFunnel3Y =
    2000 + Math.sin(this.funnelRad) * this.funnel2Length * 3;

  // private spinningRectY = 4000;
  constructor() {
    super({ key: "DropBallScene" });
  }

  // 카메라 자동추적 관련 변수
  private cameraFollowLeader: boolean = true;
  private cameraFollowTimeout?: ReturnType<typeof setTimeout>;

  // 실시간 랭킹 텍스트
  private rankingText!: Phaser.GameObjects.Text;

  // 도착한 공 정보 저장
  private finishedBalls: { idx: number; ball: MatterJS.BodyType }[] = [];

  // 공 이름 및 이름 텍스트 저장
  private ballNames: string[] = [];
  private ballNameTexts: { index: number; text: Phaser.GameObjects.Text }[] =
    [];

  preload() {}

  create() {
    this.matter.world.setBounds(
      0,
      0,
      this.worldSize.width,
      this.worldSize.height
    );

    this.cameras.main.setBackgroundColor("#222");
    this.cameras.main.setZoom(0.5);
    this.cameras.main.setBounds(
      0,
      0,
      this.worldSize.width,
      this.worldSize.height
    );

    this.makeWalls();

    // 핀(장애물) 배치 (Matter Physics)
    // this.addPins(this.leftX, 4, 200);
    const centerX = this.leftX + this.width / 2;
    this.addSpinningCross(
      this.leftX + (this.width / 4) * 1,
      500,
      250,
      20,
      0.03
    );
    this.addSpinningCross(
      this.leftX + (this.width / 4) * 3,
      500,
      250,
      20,
      -0.03
    );
    this.addSpinningCross(this.leftX + this.width / 2, 750, 250, 20);
    this.addSpinningCross(
      this.leftX + (this.width / 4) * 1,
      1000,
      250,
      20,
      -0.03
    );
    this.addSpinningCross(
      this.leftX + (this.width / 4) * 3,
      1000,
      250,
      20,
      0.03
    );
    this.makeFunnels();
    this.addPins(centerX, 7, 3, 1500);
    this.addSpinningRect(
      this.rightX + (this.width / 3) * 1,
      3800,
      500,
      20,
      0.005
    );
    this.addSpinningRect(
      this.rightX + (this.width / 3) * 2,
      4200,
      500,
      20,
      -0.005
    );

    this.addPins(centerX, 7, 5, 5200);
    this.makeLastFunnel();

    // 마우스 드래그로 카메라 이동 기능 + 자동추적 일시정지
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this._dragCamera = true;
      this._dragStart = { x: pointer.x, y: pointer.y };
      this._cameraStart = {
        x: this.cameras.main.scrollX,
        y: this.cameras.main.scrollY,
      };
      if (this.gameStarted) {
        // 드래그 시작 시 자동추적 일시정지
        this.cameraFollowLeader = false;
        if (this.cameraFollowTimeout) clearTimeout(this.cameraFollowTimeout);
      }
    });
    this.input.on("pointerup", () => {
      this._dragCamera = false;
      // 3초 후 자동추적 재개
      if (this.cameraFollowTimeout) clearTimeout(this.cameraFollowTimeout);
      this.cameraFollowTimeout = setTimeout(() => {
        this.cameraFollowLeader = true;
      }, 3000);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this._dragCamera && pointer.isDown) {
        const dx = pointer.x - this._dragStart.x;
        const dy = pointer.y - this._dragStart.y;
        this.cameras.main.scrollX =
          this._cameraStart.x - dx / this.cameras.main.zoom;
        this.cameras.main.scrollY =
          this._cameraStart.y - dy / this.cameras.main.zoom;
        // 드래그 중 입력이 있으면 타이머 리셋
        if (this.cameraFollowTimeout) clearTimeout(this.cameraFollowTimeout);
        this.cameraFollowTimeout = setTimeout(() => {
          this.cameraFollowLeader = true;
        }, 3000);
      }
    });

    // 여러 개의 작은 슬로우존 생성 (예시: 5개)
    this.slowZones = [];
    // for (let i = 0; i < 5; i++) {
    //   const zoneWidth = this.width * 0.4;
    //   const zoneHeight = 80;
    //   const zoneX = this.leftX + Phaser.Math.Between(0, this.width - zoneWidth);
    //   const zoneY = 2000 + i * 100;
    //   this.slowZones.push({
    //     x: zoneX,
    //     y: zoneY,
    //     width: zoneWidth,
    //     height: zoneHeight,q                                                                                                                                                                                                             q
    //   });
    // }
    // 시각적 표시(반투명 파란색 사각형)
    for (const zone of this.slowZones) {
      this.add
        .rectangle(
          zone.x + zone.width / 2,
          zone.y + zone.height / 2,
          zone.width,
          zone.height,
          0x3399ff,
          0.25
        )
        .setDepth(-1);
    }

    // 실시간 랭킹 텍스트 (우측 상단)
    this.rankingText = this.add
      .text(this.cameras.main.width + 200, -100, "", {
        font: "50px Arial",
        color: "#fff",
        backgroundColor: "#222",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        align: "right",
      })
      .setScrollFactor(0)
      .setDepth(1000);
    // 공 이름 입력 UI 호출
    this.showNameInputUI();
  }
  makeFunnels() {
    const funnel2LeftGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.leftX + (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel2Y + (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: -this.funnelRad,
      }
    );
    const funnel2CenterLeftGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.leftX +
        Math.cos(this.funnelRad) * this.funnel2Length * 2 -
        (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel2Y +
        Math.sin(this.funnelRad) * this.funnel2Length * 2 +
        (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: this.funnelRad,
      }
    );
    // 깔때기 사선 벽(오른쪽)
    const funnel2RightGuide = this.matter.add.rectangle(
      this.rightX - (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel2Y + (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: this.funnelRad,
      }
    );
    const funnel2CenterRightGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.rightX -
        Math.cos(this.funnelRad) * this.funnel2Length * 2 +
        (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel2Y +
        Math.sin(this.funnelRad) * this.funnel2Length * 2 +
        (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: -this.funnelRad,
      }
    );

    // 깔때기 사선 벽(왼쪽)
    const funnel3LeftGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.leftX + (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel3Y + (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: -this.funnelRad,
      }
    );
    const funnel3CenterLeftGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.leftX +
        Math.cos(this.funnelRad) * this.funnel2Length * 2 -
        (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel3Y +
        Math.sin(this.funnelRad) * this.funnel2Length * 2 +
        (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: this.funnelRad,
      }
    );
    // 깔때기 사선 벽(오른쪽)
    const funnel3RightGuide = this.matter.add.rectangle(
      this.rightX - (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel3Y + (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: this.funnelRad,
      }
    );
    const funnel3CenterRightGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.rightX -
        Math.cos(this.funnelRad) * this.funnel2Length * 2 +
        (Math.cos(this.funnelRad) * this.funnel2Length) / 2,
      this.startFunnel3Y +
        Math.sin(this.funnelRad) * this.funnel2Length * 2 +
        (Math.sin(this.funnelRad) * this.funnel2Length) / 2,
      20,
      this.funnel2Length,
      {
        isStatic: true,
        angle: -this.funnelRad,
      }
    );
    this.walls.push(
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
    const finalFunnelY = 6000;
    const funnelWall = 400;
    // 깔때기 사선 벽(왼쪽)
    const lastFunnel = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      this.leftX + (Math.cos(this.funnelRad) * this.funnelLength) / 2,
      finalFunnelY + (Math.sin(this.funnelRad) * this.funnelLength) / 2,
      20,
      this.funnelLength,
      {
        isStatic: true,
        angle: -this.funnelRad,
      }
    );

    const funnelLeftWall = this.matter.add.rectangle(
      this.leftX + Math.cos(this.funnelRad) * this.funnelLength,
      finalFunnelY +
        Math.sin(this.funnelRad) * this.funnelLength +
        funnelWall / 2,
      20,
      funnelWall,
      {
        isStatic: true,
      }
    );

    // 깔때기 사선 벽(오른쪽)
    const rightFunnel = this.matter.add.rectangle(
      this.rightX - (Math.cos(this.funnelRad) * this.funnelLength) / 2,
      finalFunnelY + (Math.sin(this.funnelRad) * this.funnelLength) / 2,
      20,
      this.funnelLength,
      {
        isStatic: true,
        angle: this.funnelRad,
      }
    );
    const funnelRightWall = this.matter.add.rectangle(
      this.rightX - Math.cos(this.funnelRad) * this.funnelLength,
      finalFunnelY +
        Math.sin(this.funnelRad) * this.funnelLength +
        funnelWall / 2,
      20,
      funnelWall,
      {
        isStatic: true,
      }
    );

    this.walls.push(lastFunnel, funnelLeftWall, rightFunnel, funnelRightWall);

    this.addSpinningRect(this.leftX, finalFunnelY + 450, 800, 20, -0.003);
  }

  // 회전 장애물 정보 저장용 타입
  private spinningRects: { body: MatterJS.BodyType; speed: number }[] = [];
  // 십자 장애물 정보 저장용 타입
  private spinningCrosses: { bars: MatterJS.BodyType[]; speed: number }[] = [];

  addSpinningRect(
    crossX: number,
    crossY: number,
    width: number = 400,
    height: number = 20,
    speed: number = 0.005,
    initialAngle?: number
  ) {
    // 정적으로 고정된 회전 장애물
    const angle =
      initialAngle !== undefined
        ? initialAngle
        : Phaser.Math.FloatBetween(0, Math.PI * 2);
    const crossBar1 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle,
    });
    this.spinningRects.push({ body: crossBar1, speed });
  }

  addSpinningCross(
    crossX: number,
    crossY: number,
    width: number = 200,
    height: number = 20,
    speed: number = 0.03,
    initialAngle?: number
  ) {
    // 정적으로 고정된 회전 십자 장애물
    const angle =
      initialAngle !== undefined
        ? initialAngle
        : Phaser.Math.FloatBetween(0, Math.PI * 2);
    const crossBar1 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle,
    });
    const crossBar2 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle: angle + Phaser.Math.DegToRad(90),
    });
    this.crossBars.push(crossBar1, crossBar2);
    this.spinningCrosses.push({ bars: [crossBar1, crossBar2], speed });
  }

  dropBallsMatter() {
    this.balls = [];
    for (let i = 0; i < this.ballCount; i++) {
      const x = Phaser.Math.Between(this.leftX + 50, this.rightX - 50);
      const ball = this.matter.add.circle(x, 0, this.ballRadius, {
        restitution: 0.6,
        friction: 0.01,
        frictionAir: 0.002,
      });
      this.balls.push({ index: i, ball });
      // 공 이름 지정 (입력값 우선, 없으면 번호)
      const name = this.ballNames[i] || `${i + 1}번`;
      // 이름 텍스트 생성 및 저장 (index와 함께)
      const nameText = this.add
        .text(ball.position.x, ball.position.y - this.ballRadius, name, {
          font: "30px Arial",
          color: "#fff",
          backgroundColor: "#222",
          padding: { left: 4, right: 4, top: 2, bottom: 2 },
        })
        .setOrigin(0.5, 1);
      this.ballNameTexts.push({ index: i, text: nameText });
    }
  }

  update() {
    // 현재 타임스케일에 맞춰 회전 속도 조절
    const timeScale = this.matter.world.engine.timing.timeScale || 1;
    // 십자 장애물 회전 (개별 속도)
    for (const cross of this.spinningCrosses) {
      for (const bar of cross.bars) {
        this.matter.body.setAngle(bar, bar.angle + cross.speed * timeScale);
      }
    }
    // 새로운 방식: 개별 속도 지정 회전 장애물
    for (const rect of this.spinningRects) {
      this.matter.body.setAngle(
        rect.body,
        rect.body.angle + rect.speed * timeScale
      );
    }

    // 1등(가장 y가 큰, 즉 가장 아래에 있는) 공 찾기
    let leaderObj = this.balls[0];
    let maxY = Number.NEGATIVE_INFINITY;
    this.balls.forEach((b) => {
      if (b.ball && b.ball.position && b.ball.position.y > maxY) {
        maxY = b.ball.position.y;
        leaderObj = b;
      }
    });
    const leader = leaderObj ? leaderObj.ball : undefined;

    // 마지막 깔대기 근처에서 월드 속도(중력) 낮추기
    const slowZoneStartY = 6000 - 300; // 마지막 깔대기 시작점 근처(6000은 makeLastFunnel의 Y)
    const slowZoneEndY = 6000 + 600; // 깔대기 아래까지
    if (
      this.finishedBalls.length === 0 &&
      leader &&
      leader.position &&
      leader.position.y > slowZoneStartY &&
      leader.position.y < slowZoneEndY
    ) {
      this.matter.world.engine.timing.timeScale = 0.4; // 전체 게임 속도 느리게
    } else {
      this.matter.world.engine.timing.timeScale = 1; // 기본 속도
    }

    // 1등 공이 있으면 카메라가 따라가도록 설정 (자동추적)
    if (this.cameraFollowLeader && leader && leader.position) {
      this.cameras.main.centerOn(leader.position.x, leader.position.y);
    }

    // 슬롯 체크 (Matter Physics)
    this.balls = this.balls.filter(({ index, ball }) => {
      if (
        ball &&
        ball.position &&
        ball.position.y > this.worldSize.height - 100
      ) {
        // 도착한 공을 finishedBalls에 저장
        this.finishedBalls.push({ idx: index + 1, ball });
        // 이름 텍스트도 숨김
        const nameTextObj = this.ballNameTexts.find((t) => t.index === index);
        if (nameTextObj) nameTextObj.text.setVisible(false);
        this.matter.world.remove(ball);
        return false; // 배열에서 제거
      }
      return true;
    });

    // 공 이름 텍스트 위치 업데이트 (공이 월드에서 제거된 경우 숨김)
    this.ballNameTexts.forEach(({ index, text }) => {
      const ballObj = this.balls.find((b) => b.index === index);
      if (ballObj && ballObj.ball && ballObj.ball.position) {
        text.setPosition(
          ballObj.ball.position.x,
          ballObj.ball.position.y - this.ballRadius - 18
        );
        text.setVisible(true);
      } else {
        text.setVisible(false);
      }
    });

    // 속도 감속 지역 적용
    for (const zone of this.slowZones) {
      for (const ballObj of this.balls) {
        const ball = ballObj.ball;
        if (
          ball.position.x > zone.x &&
          ball.position.x < zone.x + zone.width &&
          ball.position.y > zone.y &&
          ball.position.y < zone.y + zone.height
        ) {
          // 감속 효과: 속도를 0.5배로 줄임
          this.matter.body.setVelocity(ball, {
            x: ball.velocity.x * 0.5,
            y: ball.velocity.y * 0.5,
          });
        }
      }
    }

    // 실시간 랭킹 표시
    if (this.rankingText) {
      // y값이 큰 순서대로(아래로 내려갈수록 순위가 높음)
      const liveBalls = this.balls.map(({ index, ball }) => ({
        idx: index + 1,
        y: ball.position.y,
        finished: false,
        name: this.ballNames[index] || `${index + 1}번`,
      }));
      const finishedBalls = this.finishedBalls.map((item, _i) => {
        const idx = item.idx - 1;
        return {
          idx: item.idx,
          y: item.ball.position.y,
          finished: true,
          name: this.ballNames[idx] || `${item.idx}번`,
        };
      });
      const allBalls = [...liveBalls, ...finishedBalls];
      const ranking = allBalls
        .sort((a, b) => b.y - a.y)
        .map((item, i) =>
          item.finished
            ? `#${i + 1} ${item.name} (도착)`
            : `#${i + 1} ${item.name}`
        )
        .join("\n");
      this.rankingText.setText("실시간 랭킹\n" + ranking);
    }
  }

  addPins(centerX: number, _pinCount: number, pinRows: number, startY: number) {
    for (let row = 0; row < pinRows; row++) {
      const pinCount = _pinCount + (row % 2 === 0 ? 1 : 0);
      const rowY = startY + row * 70;
      const spacing = 80;
      let startX = centerX - ((pinCount - 1) / 2) * spacing;
      for (let col = 0; col < pinCount; col++) {
        const x = startX + col * spacing;
        const y = rowY;
        const pin = this.matter.add.circle(x, y, 4, {
          isStatic: true,
          restitution: 1.2,
        });
        this.pins.push(pin);
      }
    }
  }

  makeWalls() {
    // Matter Physics용 벽(왼쪽, 오른쪽, 깔때기) 생성
    // 왼쪽 세로 벽
    const wallTickness = 200;
    const leftWall = this.matter.add.rectangle(
      this.leftX - wallTickness / 2,
      this.worldSize.height / 2,
      wallTickness,
      this.worldSize.height,
      { isStatic: true }
    );
    // 오른쪽 세로 벽
    const rightWall = this.matter.add.rectangle(
      this.rightX + wallTickness / 2,
      this.curveStartY / 2,
      wallTickness,
      this.curveStartY,
      { isStatic: true }
    );
    const rightCurveWall = this.matter.add.rectangle(
      this.rightX + this.width / 2,
      this.curveStartY + (this.curveEndY - this.curveStartY) / 2,
      20,
      (1 / Math.cos(this.curveRad)) * this.width,
      { isStatic: true, angle: this.curveRad }
    );

    const leftCurveWall = this.matter.add.rectangle(
      this.leftX + this.width / 2,
      this.curveStartY + (this.curveEndY - this.curveStartY) / 2,
      20,
      (1 / Math.cos(this.curveRad)) * this.width,
      { isStatic: true, angle: this.curveRad }
    );

    const leftSecondWall = this.matter.add.rectangle(
      this.leftX + this.width - wallTickness / 2,
      this.curveEndY + (this.comebackCurveStartY - this.curveEndY) / 2,
      wallTickness,
      this.comebackCurveStartY - this.curveEndY,
      { isStatic: true }
    );

    const rightSecondWall = this.matter.add.rectangle(
      this.rightX + this.width + wallTickness / 2,
      this.curveEndY + (this.comebackCurveStartY - this.curveEndY) / 2,
      wallTickness,
      this.comebackCurveStartY - this.curveEndY,
      { isStatic: true }
    );

    const leftCurve2Wall = this.matter.add.rectangle(
      this.leftX + this.width / 2,
      this.comebackCurveStartY +
        (this.comebackCurveEndY - this.comebackCurveStartY) / 2,
      20,
      (1 / Math.cos(this.curveRad)) * this.width,
      { isStatic: true, angle: -this.curveRad }
    );
    const rightCurve2Wall = this.matter.add.rectangle(
      this.rightX + this.width / 2,
      this.comebackCurveStartY +
        (this.comebackCurveEndY - this.comebackCurveStartY) / 2,
      20,
      (1 / Math.cos(this.curveRad)) * this.width,
      { isStatic: true, angle: -this.curveRad }
    );
    const rightFinalWall = this.matter.add.rectangle(
      this.rightX + wallTickness / 2,
      this.comebackCurveEndY +
        (this.worldSize.height - this.comebackCurveEndY) / 2,
      wallTickness,
      this.worldSize.height - this.comebackCurveEndY,
      { isStatic: true }
    );

    this.walls.push(
      leftWall,
      rightWall,
      leftCurveWall,
      leftSecondWall,
      leftCurve2Wall,
      rightCurveWall,
      rightSecondWall,
      rightCurve2Wall,
      rightFinalWall
    );
  }

  showResult() {
    // 결과 표시 (순서대로)
    this.add.text(
      320,
      30 + this.results.length * 22,
      `${this.results.length}등: ${
        this.results[this.results.length - 1]
      }번 슬롯`,
      {
        font: "18px Arial",
        color: "#fff",
      }
    );
    // 게임 종료 시 입력 UI 다시 표시
    this.showNameInputUI();
  }

  // 공 이름 입력 UI를 띄우는 함수 (create, 게임 재시작 모두에서 사용)
  showNameInputUI() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    // 라벨
    const nameInputLabel = document.createElement("label");
    nameInputLabel.innerText = "공 이름을 입력하세요 (콤마로 구분):";
    nameInputLabel.style.position = "absolute";
    nameInputLabel.style.left = rect.left + 24 + "px";
    nameInputLabel.style.top = rect.bottom - 120 + "px";
    nameInputLabel.style.fontSize = "22px";
    nameInputLabel.style.color = "#fff";
    nameInputLabel.style.background = "rgba(34,34,34,0.92)";
    nameInputLabel.style.padding = "8px 12px 4px 12px";
    nameInputLabel.style.borderRadius = "8px 8px 0 0";
    nameInputLabel.style.zIndex = "1000";
    document.body.appendChild(nameInputLabel);
    // 입력창
    const nameInputBox = document.createElement("textarea");
    nameInputBox.value = "공1,공2,공3,공4,공5,공6,공7,공8,공9,공10";
    nameInputBox.placeholder = "예: 공1,공2,공3";
    nameInputBox.style.position = "absolute";
    nameInputBox.style.left = rect.left + 24 + "px";
    nameInputBox.style.top = rect.bottom - 70 + "px";
    nameInputBox.style.width = "320px";
    nameInputBox.style.height = "80px";
    nameInputBox.style.fontSize = "22px";
    nameInputBox.style.borderRadius = "0 0 0 0";
    nameInputBox.style.padding = "8px";
    nameInputBox.style.background = "#333";
    nameInputBox.style.color = "#fff";
    nameInputBox.style.border = "none";
    nameInputBox.style.outline = "none";
    nameInputBox.style.zIndex = "1000";
    nameInputBox.style.resize = "none";
    nameInputBox.style.overflowY = "auto";
    nameInputBox.style.whiteSpace = "pre-wrap";
    nameInputBox.style.wordBreak = "break-all";
    nameInputBox.wrap = "soft";
    document.body.appendChild(nameInputBox);
    // 버튼
    const nameInputBtn = document.createElement("button");
    nameInputBtn.innerText = "시작";
    nameInputBtn.style.position = "absolute";
    nameInputBtn.style.left = rect.left + 24 + 340 + "px";
    nameInputBtn.style.top = rect.bottom - 70 + "px";
    nameInputBtn.style.height = "42px";
    nameInputBtn.style.fontSize = "22px";
    nameInputBtn.style.background = "#fff";
    nameInputBtn.style.color = "#222";
    nameInputBtn.style.border = "none";
    nameInputBtn.style.borderRadius = "0 8px 8px 0";
    nameInputBtn.style.padding = "0 24px";
    nameInputBtn.style.cursor = "pointer";
    nameInputBtn.style.zIndex = "1000";
    document.body.appendChild(nameInputBtn);
    // 버튼 클릭 시 이름 적용 및 UI 제거
    nameInputBtn.onclick = () => {
      const names = (nameInputBox.value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length > 0) {
        this.ballNames = names;
        this.ballCount = names.length;
        this.balls = [];
        this.ballNameTexts.forEach((t) => t.text.destroy());
        this.ballNameTexts = [];
        this.finishedBalls = [];
        this.results = [];
        this.dropBallsMatter();
        // UI 제거
        nameInputBox.remove();
        nameInputLabel.remove();
        nameInputBtn.remove();
        this.cameraFollowLeader = true;
        this.gameStarted = true;
      }
    };
  }
}

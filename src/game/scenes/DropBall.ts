import Phaser from "phaser";

export default class DropBallScene extends Phaser.Scene {
  private balls: MatterJS.BodyType[] = [];
  private pins: MatterJS.BodyType[] = [];
  private slots: MatterJS.BodyType[] = [];
  private results: number[] = [];
  private ballCount: number = 10;
  private pinCount: number = 6;
  private ballRadius: number = 15;
  private gameStarted: boolean = false;
  private worldSize = { width: 1280, height: 8000 };
  private crossBars: MatterJS.BodyType[] = [];
  private spinningRect: MatterJS.BodyType[] = [];

  // 드래그 상태 변수 선언
  private _dragCamera: boolean = false;
  private _dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private _cameraStart: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    super({ key: "DropBallScene" });
  }

  preload() {}

  create() {
    this.matter.world.setBounds(
      0,
      0,
      this.worldSize.width,
      this.worldSize.height
    );

    const worldCenterX = this.worldSize.width / 2;
    const width = 500;
    const leftX = worldCenterX - width / 2;
    const rightX = leftX + width;
    const startFunnelY = 900;
    const funnelLength = 300;
    const funnelRad = Phaser.Math.DegToRad(-45);

    this.cameras.main.setBackgroundColor("#222");
    this.cameras.main.setZoom(0.5);
    this.cameras.main.setBounds(
      0,
      0,
      this.worldSize.width,
      this.worldSize.height
    );

    // Matter Physics용 벽(왼쪽, 오른쪽, 깔때기) 생성
    const walls: MatterJS.BodyType[] = [];
    // 왼쪽 세로 벽
    const leftWall = this.matter.add.rectangle(
      leftX,
      this.worldSize.height / 2,
      20,
      this.worldSize.height,
      { isStatic: true }
    );
    // 오른쪽 세로 벽
    const rightWall = this.matter.add.rectangle(
      rightX,
      this.worldSize.height / 2,
      20,
      this.worldSize.height,
      { isStatic: true }
    );
    // 깔때기 사선 벽(왼쪽)
    const leftGuide = this.matter.add.rectangle(
      //funnelLength 를 사선으로 두고 가로 길이를 계산해서 그만큼 이동
      leftX + (Math.cos(funnelRad) * funnelLength) / 2,
      startFunnelY + funnelLength / 2,
      20,
      funnelLength,
      {
        isStatic: true,
        angle: funnelRad,
      }
    );
    // 깔때기 사선 벽(오른쪽)
    const rightGuide = this.matter.add.rectangle(
      rightX - (Math.cos(funnelRad) * funnelLength) / 2,
      startFunnelY + funnelLength / 2,
      20,
      funnelLength,
      {
        isStatic: true,
        angle: -funnelRad,
      }
    );
    walls.push(leftWall, rightWall, leftGuide, rightGuide);

    // Matter Physics용 슬롯(구멍) 생성
    // const slotBody = this.matter.add.rectangle(worldCenterX, 1100, 80, 20, {
    //   isStatic: true,
    // });
    // this.slots = [slotBody];

    // 안내 텍스트
    this.add.text(20, 20, "클릭하면 공이 떨어집니다!", {
      font: "20px Arial",
      color: "#fff",
    });

    // 클릭 시 공 생성
    this.input.on("pointerdown", () => {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.dropBallsMatter(leftX, rightX);
      }
    });

    // 핀(장애물) 배치 (Matter Physics)
    this.addPins(leftX, 4, 200);
    this.addPins(leftX, 4, 1500);
    this.addSpinningCross((this.worldSize.width / 5) * 3, 600, 100, 20);
    this.addSpinningCross((this.worldSize.width / 5) * 2, 600, 100, 20);
    this.addSpinningCross(this.worldSize.width / 2, 850);
    this.addSpinningRect(800, 1150);
    this.addWorldBorder(this.worldSize);

    // 마우스 드래그로 카메라 이동 기능
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this._dragCamera = true;
      this._dragStart = { x: pointer.x, y: pointer.y };
      this._cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
    });
    this.input.on('pointerup', () => {
      this._dragCamera = false;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this._dragCamera && pointer.isDown) {
        const dx = pointer.x - this._dragStart.x;
        const dy = pointer.y - this._dragStart.y;
        this.cameras.main.scrollX = this._cameraStart.x - dx / this.cameras.main.zoom;
        this.cameras.main.scrollY = this._cameraStart.y - dy / this.cameras.main.zoom;
      }
    });
  }

  addSpinningRect(
    crossX: number,
    crossY: number,
    width: number = 400,
    height: number = 20
  ) {
    // 정적으로 고정된 회전 장애물
    const crossBar1 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle: 0,
    });
    this.spinningRect.push(crossBar1);
  }

  addSpinningCross(
    crossX: number,
    crossY: number,
    width: number = 200,
    height: number = 20
  ) {
    // 정적으로 고정된 회전 십자 장애물
    const crossBar1 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle: 0,
    });
    const crossBar2 = this.matter.add.rectangle(crossX, crossY, width, height, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(90),
    });
    this.crossBars.push(crossBar1, crossBar2);
  }

  dropBallsMatter(leftX: number, rightX: number) {
    for (let i = 0; i < this.ballCount; i++) {
      const x = Phaser.Math.Between(leftX + 50, rightX - 50);
      const ball = this.matter.add.circle(x, 0, this.ballRadius, {
        restitution: 0.6,
        friction: 0.01,
        frictionAir: 0.002,
      });
      this.balls.push(ball);
    }
  }

  update() {
    // 십자 장애물 회전 (정속)
    if (this.crossBars && this.crossBars.length > 0) {
      const speed = 0.03; // 회전 속도 (라디안/프레임)
      // MatterJS의 setAngle을 사용해야 실제 물리 바디에 반영됨
      for (const crossbar of this.crossBars) {
        this.matter.body.setAngle(crossbar, crossbar.angle + speed);
      }
    }
    if (this.spinningRect && this.spinningRect.length > 0) {
      const speed = 0.005; // 회전 속도 (라디안/프레임)
      // MatterJS의 setAngle을 사용해야 실제 물리 바디에 반영됨
      for (const spinningRect of this.spinningRect) {
        this.matter.body.setAngle(spinningRect, spinningRect.angle + speed);
      }
    }

    // 1등(가장 y가 큰, 즉 가장 아래에 있는) 공 찾기
    let leader = null;
    let maxY = Number.NEGATIVE_INFINITY;
    this.balls.forEach((ball) => {
      if (ball && ball.position && ball.position.y > maxY) {
        maxY = ball.position.y;
        leader = ball;
      }
    });
    // 1등 공이 있으면 카메라가 따라가도록 설정
    if (leader && (leader as MatterJS.BodyType).position) {
      const pos = (leader as MatterJS.BodyType).position;
      // this.cameras.main.centerOn(pos.x, pos.y);
    }

    // 슬롯 체크 (Matter Physics)
    this.balls = this.balls.filter((ball) => {
      if (
        ball &&
        ball.position &&
        ball.position.y > this.worldSize.height - 100
      ) {
        // Matter Physics에서는 setStatic(true)로 멈추거나, 월드에서 제거
        this.matter.world.remove(ball);
        this.showResult();
        return false; // 배열에서 제거
      }
      return true;
    });
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
  }

  addPins(leftX: number, pinRows: number, startY: number) {
    for (let row = 0; row < pinRows; row++) {
      const pinCount = this.pinCount + (row % 2 === 0 ? 1 : 0);
      for (let col = 0; col < pinCount; col++) {
        const x = leftX + 70 + col * 60 + (row % 2 === 0 ? 0 : 30);
        const y = startY + row * 60;
        const pin = this.matter.add.circle(x, y, 8, {
          isStatic: true,
          restitution: 1.2,
        });
        this.pins.push(pin);
      }
    }
  }

  addWorldBorder(worldSize: { width: number; height: number }) {
    // 월드의 네 모서리에 Matter Physics용 테두리(선) 추가 (시각적 표시만)
    const borderColor = 0xffffff; // 밝은색(흰색)으로 변경
    // this.add.line(0, 0, 0, 0, worldSize.width, 0, borderColor).setOrigin(0, 0); // 상단
    this.add
      .line(
        0,
        0,
        worldSize.width,
        0,
        worldSize.width,
        worldSize.height,
        borderColor
      )
      .setOrigin(0, 0); // 우측
    // this.add
    //   .line(
    //     0,
    //     0,
    //     worldSize.width,
    //     worldSize.height,
    //     0,
    //     worldSize.height,
    //     borderColor
    //   )
    //   .setOrigin(0, 0); // 하단
    this.add.line(0, 0, 0, worldSize.height, 0, 0, borderColor).setOrigin(0, 0); // 좌측
  }
}

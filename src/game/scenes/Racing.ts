import Phaser from "phaser";

export default class RacingScene extends Phaser.Scene {
  private horses: Phaser.Physics.Arcade.Sprite[] = [];
  private finishLine: number = 800; // Example finish line position
  private raceStarted: boolean = false;
  private obstacles: Phaser.Physics.Arcade.Sprite[] = [];

  constructor() {
    super({ key: "RacingScene" });
  }
  
  preload() {}

  create() {
    // Enable physics
    this.physics.world.setBounds(0, 0, 2000, 600); // 가로 2000px로 확장
    this.physics.world.setFPS(60); // 물리 엔진 FPS 설정
    this.physics.world.setBoundsCollision(true, true, true, true); // 월드 경계 충돌 활성화
    // 트랙 그리기
    const graphics = this.add.graphics();
    graphics.fillStyle(0x228b22, 1); // 초록색 트랙
    graphics.fillRect(50, 50, 1900, 500); // 트랙 영역도 확장

    // 트랙 경계선
    graphics.lineStyle(4, 0xffffff, 1); // 흰색 선
    graphics.strokeRect(50, 50, 1900, 500);
    this.finishLine = 1900;

    // 말 생성 및 물리 바디 추가
    for (let i = 0; i < 10; i++) {
      const horse = this.physics.add.sprite(100, 75 + i * 50, "");
      horse.setCircle(20); // 말의 원형 충돌 영역 설정
      horse.setCollideWorldBounds(true); // 월드 경계 충돌 활성화
      horse.setDrag(10); // 마찰력 추가
      this.horses.push(horse);
    }

    // 말끼리 충돌 처리 활성화
    this.physics.add.collider(this.horses, this.horses);

    // 레이스 시작 이벤트
    this.input.on("pointerdown", () => {
      if (!this.raceStarted) {
        this.startRace();
      }
    });

    // 장애물을 경기장 중앙에 세로로 일렬 배치
    const centerX = 400;
    for (let y = 0; y <= 500; y += 100) {
      const obstacle = this.physics.add.sprite(centerX, y, "");
      obstacle.setCircle(10); // 장애물의 크기 설정
      obstacle.setImmovable(true);
      obstacle.setCollideWorldBounds(true);
      this.obstacles.push(obstacle);

      // 트윈으로 위아래로 천천히 움직이게 설정
      this.tweens.add({
        targets: obstacle,
        y: y + 40,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const x2 = 500;
    for (let y = 50; y <= 500; y += 100) {
      const obstacle = this.physics.add.sprite(x2, y, "");
      obstacle.setCircle(10); // 장애물의 크기 설정
      obstacle.setImmovable(true);
      obstacle.setCollideWorldBounds(true);
      this.obstacles.push(obstacle);

      // 트윈으로 위아래로 천천히 움직이게 설정
      this.tweens.add({
        targets: obstacle,
        y: y + 40,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    // 장애물을 경기장 중앙에 세로로 일렬 배치
    const x3 = 600;
    for (let y = 0; y <= 500; y += 100) {
      const obstacle = this.physics.add.sprite(x3, y, "");
      obstacle.setCircle(10); // 장애물의 크기 설정
      obstacle.setImmovable(true);
      obstacle.setCollideWorldBounds(true);
      this.obstacles.push(obstacle);

      // 트윈으로 위아래로 천천히 움직이게 설정
      this.tweens.add({
        targets: obstacle,
        y: y + 40,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    // 말과 장애물 충돌 처리
    this.horses.forEach((horse) => {
      this.obstacles.forEach((obstacle) => {
        this.physics.add.collider(horse, obstacle);
      });
    });

    // 카메라 설정: 1등 말을 따라가도록
    this.cameras.main.setBounds(0, 0, 2000, 600);
    this.cameras.main.startFollow(this.horses[0], true, 0.1, 0.1);
  }

  addForce(horse: Phaser.Physics.Arcade.Sprite) {
    const randomYMovement = Phaser.Math.Between(-20, 20);
    horse.setVelocityY(randomYMovement + Phaser.Math.DegToRad(1));
    // horse.setRotation(horse.rotation + Phaser.Math.DegToRad(1)); // 말의 회전 추가
  }
  startRace() {
    this.raceStarted = true;

    this.horses.forEach((horse) => {
      //   const forceX = Phaser.Math.Between(50, 100); // X축으로 가해질 초기 힘
      const randomAcceleration = Phaser.Math.Between(25, 30); // 가속도 추가
      //   horse.setVelocityX(forceX); // 초기 속도 설정
      horse.setAccelerationX(randomAcceleration); // 가속도 설정

      // 경로의 불규칙성을 위해 Y축으로 약간의 랜덤 이동 추가
      const randomYMovement = Phaser.Math.Between(-10, 10);
      horse.setVelocityY(randomYMovement);
    });
  }

  update() {
    // 1등 말 찾기
    let leader = this.horses[0];
    this.horses.forEach((horse) => {
      if (horse.x > leader.x) leader = horse;
    });
    // 카메라가 1등 말을 따라가도록
    this.cameras.main.startFollow(leader, true, 0.1, 0.1);

    this.horses.forEach((horse) => {
      // 결승선 도달 확인
      if (horse.x >= this.finishLine) {
        this.endRace(horse);
      } else {
        if (this.raceStarted) {
          this.addForce(horse); // 레이스가 시작되면 힘을 추가
        }
      }
    });
  }

  endRace(winningHorse: Phaser.Physics.Arcade.Sprite) {
    this.raceStarted = false;
    console.log(
      "Race finished! Winning horse:",
      this.horses.indexOf(winningHorse) + 1
    );

    // 모든 말의 속도를 0으로 설정
    this.horses.forEach((horse) => {
      horse.setVelocity(0);
    });
  }
}

import Phaser from "phaser";
import { BallInfo } from "../BallInfo";
import { updateObstacles } from "./maps/obstacleUtils";
import { createDefaultObstacles } from "./maps/types";
import defaultMap from "./maps/defaultMap";

export default class DropBallScene extends Phaser.Scene {
  private balls: BallInfo[] = [];
  // 도착한 공 정보 저장 (rank 포함)
  private finishedBalls: BallInfo[] = [];

  private ballCount: number = 10;
  // private pinCount: number = 6;
  private ballRadius: number = 20;
  private gameStarted: boolean = false;
  private worldSize = { width: 2400, height: 7000 };

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
  // private spinningRectY = 4000;
  constructor() {
    super({ key: "DropBallScene" });
  }

  // 카메라 자동추적 관련 변수
  private cameraFollowLeader: boolean = true;
  private cameraFollowTimeout?: ReturnType<typeof setTimeout>;

  // 실시간 랭킹 텍스트
  private rankingText!: Phaser.GameObjects.Text;

  // 공 이름 및 이름 텍스트 저장
  private ballNames: string[] = [];
  private ballNameTexts: { index: number; text: Phaser.GameObjects.Text }[] =
    [];

  // 카메라 줌 목표값 및 속도
  private targetZoom: number = 0.5;
  private zoomSpeed: number = 0.02;

  // 결과 표시 플래그
  private resultShown: boolean = false;
  private winnerText?: Phaser.GameObjects.Text;

  // 장애물 정보 저장용 멤버 변수 추가
  private mapObstacles = createDefaultObstacles();

  preload() {}

  create() {
    // 브라우저 창 크기에 맞게 캔버스 크기 조정
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);
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

    // 맵 모듈화: defaultMap 사용
    const mapContext = {
      scene: this,
      matter: this.matter,
      leftX: this.leftX,
      rightX: this.rightX,
      width: this.width,
      worldSize: this.worldSize,
      ballRadius: this.ballRadius,
      obstacles: this.mapObstacles,
    };
    defaultMap(mapContext);

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

    // 창 크기 변경 시 캔버스도 자동 조정
    window.addEventListener("resize", this.handleResize);
  }

  // 회전 장애물 정보 저장용 타입
  dropBallsMatter() {
    this.balls = [];
    for (let i = 0; i < this.ballCount; i++) {
      const x = Phaser.Math.Between(this.leftX + 50, this.rightX - 50);
      const ball = this.matter.add.circle(x, 0, this.ballRadius, {
        restitution: 0.6,
        friction: 0.01,
        frictionAir: 0.002,
      });
      const name = this.ballNames[i] || `${i + 1}번`;
      this.balls.push({
        index: i,
        ball,
        rank: 0,
        name: name,
        isFinish: false,
      });
      // 공 이름 지정 (입력값 우선, 없으면 번호)
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
    // 장애물 회전 처리 모듈화
    updateObstacles(
      {
        scene: this,
        matter: this.matter,
        leftX: this.leftX,
        rightX: this.rightX,
        width: this.width,
        worldSize: this.worldSize,
        ballRadius: this.ballRadius,
        obstacles: this.mapObstacles,
      },
      this
    );

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
      this.targetZoom = 1.0; // 마지막 구간에서 카메라 줌인 목표값
    } else {
      this.matter.world.engine.timing.timeScale = 1; // 기본 속도
      this.targetZoom = 0.5; // 평소에는 기본 줌 목표값
    }
    // 카메라 줌을 부드럽게 보간
    const currentZoom = this.cameras.main.zoom;
    if (Math.abs(currentZoom - this.targetZoom) > 0.01) {
      this.cameras.main.setZoom(
        Phaser.Math.Linear(currentZoom, this.targetZoom, this.zoomSpeed)
      );
    } else {
      this.cameras.main.setZoom(this.targetZoom);
    }

    // 1등 공이 있으면 카메라가 따라가도록 설정 (자동추적, 부드럽게)
    if (this.cameraFollowLeader && leader && leader.position) {
      // 기존: this.cameras.main.centerOn(leader.position.x, leader.position.y);
      // 부드럽게 이동
      const cam = this.cameras.main;
      const lerp = 0.08; // 0~1 사이, 값이 작을수록 더 부드럽게
      const targetX = leader.position.x;
      const targetY = leader.position.y;
      cam.scrollX += (targetX - cam.midPoint.x) * lerp;
      cam.scrollY += (targetY - cam.midPoint.y) * lerp;
    }

    // 슬롯 체크 (Matter Physics)
    this.balls = this.balls.filter(({ index, ball, name }) => {
      if (
        ball &&
        ball.position &&
        ball.position.y > this.worldSize.height - 100
      ) {
        // 도착한 공을 finishedBalls에 저장 (rank 추가)
        const rank = this.finishedBalls.length + 1;
        this.finishedBalls.push({
          index: index + 1,
          ball,
          rank,
          name: name,
          isFinish: true,
        });
        // 이름 텍스트도 숨김
        const nameTextObj = this.ballNameTexts.find((t) => t.index === index);
        if (nameTextObj) nameTextObj.text.setVisible(false);
        this.matter.world.remove(ball);
        if (this.finishedBalls.length === 1 && !this.resultShown) {
          this.resultShown = true;
          this.showResult();
        }
        return false;
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
        rank: 0,
      }));
      // finishedBalls에 rank 포함
      const finishedBalls = this.finishedBalls.map((item) => {
        const index = item.index - 1;
        return {
          index: item.index,
          y: item.ball.position.y,
          finished: true,
          name: this.ballNames[index] || `${item.index}번`,
          rank: item.rank,
        };
      });
      // 도착한 공은 rank 순서대로, 아직 도착 전 공은 y값 순서대로
      const allBalls = [
        ...finishedBalls.sort((a, b) => a.rank - b.rank),
        ...liveBalls.sort((a, b) => b.y - a.y),
      ];
      const ranking = allBalls
        .map((item, i) =>
          item.finished
            ? `#${item.rank} ${item.name} (도착)`
            : `#${i + 1} ${item.name}`
        )
        .join("\n");
      this.rankingText.setText("실시간 랭킹\n" + ranking);
    }
  }

  showResult() {
    // 최종 1위 강조 표시
    if (this.winnerText) this.winnerText.destroy();
    const winner = this.finishedBalls.find((b) => b.rank === 1);
    this.winnerText = this.add
      .text(0, 0, `🏆 WINNER ${winner?.name}`, {
        font: "60px Arial",
        color: "#fff",
        backgroundColor: "#222",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(2000);
    this.handleResize();
    this.showNameInputUI();
  }

  // resize 핸들러 통합 관리
  private handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.scale.resize(w, h);
    if (this.rankingText) {
      // 필요시 랭킹 텍스트 위치 조정 (예: 화면 우측 상단 고정 시)
      this.rankingText.setPosition(w - 40, 40);
    }
    if (this.winnerText) {
      this.winnerText.setPosition(w + 500, h + 500);
    }
  };

  // 공 이름 입력 UI를 띄우는 함수 (create, 게임 재시작 모두에서 사용)
  showNameInputUI() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const inputBoxWidth = 1080;
    // 라벨
    const nameInputLabel = document.createElement("label");
    nameInputLabel.innerText = "공 이름을 입력하세요 (콤마로 구분):";
    nameInputLabel.style.position = "absolute";
    nameInputLabel.style.left = rect.left + 24 + "px";
    nameInputLabel.style.top = rect.bottom - 140 + "px";
    nameInputLabel.style.fontSize = "22px";
    nameInputLabel.style.color = "#fff";
    nameInputLabel.style.background = "rgba(34,34,34,0.92)";
    nameInputLabel.style.padding = "8px 12px 4px 12px";
    nameInputLabel.style.borderRadius = "8px 8px 0 0";
    nameInputLabel.style.zIndex = "1000";
    document.body.appendChild(nameInputLabel);
    // 입력창
    const nameInputBox = document.createElement("textarea");
    //20개 공 기본 추가
    nameInputBox.value = "공1*5,공2*3,공3*2,공4";
    nameInputBox.placeholder = "예: 공1,공2,공3";
    nameInputBox.style.position = "absolute";
    nameInputBox.style.left = rect.left + 24 + "px";
    nameInputBox.style.top = rect.bottom - 100 + "px";
    nameInputBox.style.width = `${inputBoxWidth}px`;
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
    nameInputBtn.style.left = rect.left + 24 + inputBoxWidth + 24 + "px";
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
    // 맵 선택 드롭다운 추가
    const mapSelect = document.createElement("select");
    mapSelect.style.position = "absolute";
    mapSelect.style.left = rect.left + 24 + inputBoxWidth + 180 + "px";
    mapSelect.style.top = rect.bottom - 100 + "px";
    mapSelect.style.height = "42px";
    mapSelect.style.fontSize = "22px";
    mapSelect.style.zIndex = "1000";
    mapSelect.style.background = "#fff";
    mapSelect.style.color = "#222";
    mapSelect.style.border = "none";
    mapSelect.style.borderRadius = "8px";
    mapSelect.style.padding = "0 16px";
    // 맵 옵션 추가
    mapSelect.innerHTML = `
      <option value="default">기본맵</option>
      <option value="zigzag">지그재그맵</option>
    `;
    document.body.appendChild(mapSelect);
    let selectedMap = "default";
    mapSelect.onchange = (e) => {
      selectedMap = (e.target as HTMLSelectElement).value;
      // 맵 즉시 변경: 기존 장애물 제거 및 새 맵 생성
      // 기존 장애물 제거
      this.mapObstacles.walls.forEach((wall) => this.matter.world.remove(wall));
      this.mapObstacles.pins.forEach((pin) => this.matter.world.remove(pin));
      this.mapObstacles.crossBars.forEach((bar) =>
        this.matter.world.remove(bar)
      );
      this.mapObstacles.spinningRects.forEach(({ body }) =>
        this.matter.world.remove(body)
      );
      this.mapObstacles.spinningCrosses.forEach(({ bars }) =>
        bars.forEach((bar) => this.matter.world.remove(bar))
      );
      this.mapObstacles.spinningTriangles.forEach(({ body }) =>
        this.matter.world.remove(body)
      );
      // 장애물 상태 초기화
      this.mapObstacles = createDefaultObstacles();
      const mapContext = {
        scene: this,
        matter: this.matter,
        leftX: this.leftX,
        rightX: this.rightX,
        width: this.width,
        worldSize: this.worldSize,
        ballRadius: this.ballRadius,
        obstacles: this.mapObstacles,
      };
      if (selectedMap === "zigzag") {
        import("./maps/zigzagMap").then((mod) => {
          mod.default(mapContext);
        });
      } else {
        import("./maps/defaultMap").then((mod) => {
          mod.default(mapContext);
        });
      }
    };

    // 버튼 클릭 시 이름 적용 및 UI 제거
    nameInputBtn.onclick = () => {
      const names = (nameInputBox.value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length > 0) {
        const parsedNames: string[] = [];

        names.forEach((name) => {
          const match = name.match(/^(.*)\*(\d+)$/);
          if (match) {
            const baseName = match[1].trim();
            const count = parseInt(match[2], 10);
            for (let i = 0; i < count; i++) {
              parsedNames.push(baseName);
            }
          } else {
            parsedNames.push(name);
          }
        });

        const uniqueNames: { [key: string]: number } = {};
        this.ballNames = parsedNames.map((name) => {
          if (uniqueNames[name] === undefined) {
            uniqueNames[name] = 1;
            return name;
          } else {
            const newName = `${name}#${uniqueNames[name]}`;
            uniqueNames[name]++;
            return newName;
          }
        });

        this.ballCount = this.ballNames.length;

        // 기존 공 모두 파괴 (Matter에서 제거)
        this.balls.forEach(({ ball }) => {
          if (ball && ball.position) {
            this.matter.world.remove(ball);
          }
        });
        this.balls = [];
        this.ballNameTexts.forEach((t) => t.text.destroy());
        this.ballNameTexts = [];
        this.finishedBalls = [];
        this.resultShown = false; // 게임 재시작 시 결과 플래그 초기화
        this.dropBallsMatter();

        // UI 제거
        nameInputBox.remove();
        nameInputLabel.remove();
        nameInputBtn.remove();
        mapSelect.remove();
        this.cameraFollowLeader = true;
        this.gameStarted = true;
        if (this.winnerText) {
          this.winnerText.destroy();
          this.winnerText = undefined;
        }
      }
    };
  }

  // destroy 시 resize 핸들러 해제
  shutdown() {
    window.removeEventListener("resize", this.handleResize);
  }
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }
}

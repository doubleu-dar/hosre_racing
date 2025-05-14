import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";
import RacingScene from "./scenes/Racing";
import DropBallScene from "./scenes/DropBall";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: 1 }, // y축 중력값을 1로 설정 (필요시 조정)
      debug: {
        showBody: true,
        showStaticBody: true,
        showInternalEdges: true,
        // 색상 커스텀
        lineColor: 0xffffff, // 모든 바디 선 색상 (흰색)
        staticLineColor: 0x00ff00, // static 바디 선 색상 (초록)
        fillColor: 0x2222ff, // 동적 바디 내부 채움색
      },
    },
  },
  scene: [DropBallScene],
};
const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;

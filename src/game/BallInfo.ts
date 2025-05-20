export class BallInfo {
  constructor(
    public index: number,
    public ball: MatterJS.BodyType,
    public name: string, // 공 이름
    public rank: number = 0, // 도착 순위
    public isFinish: boolean = false // 도착 여부
  ) {}
}

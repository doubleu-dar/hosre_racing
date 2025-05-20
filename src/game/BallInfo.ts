export class BallInfo {
  constructor(
    public index: number,
    public ball: MatterJS.BodyType,
    public rank: number // 도착 순위
  ) {}
}

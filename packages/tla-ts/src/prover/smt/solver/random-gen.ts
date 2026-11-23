export class RandomGen {
  constructor(private seed: number) {}

  setSeed(seed: number) {
    this.seed = seed;
  }

  next() {
    this.seed = (Math.imul(this.seed, 214013) + 2531011) >>> 0;
    return (this.seed >>> 16) & 0x7fff;
  }
}

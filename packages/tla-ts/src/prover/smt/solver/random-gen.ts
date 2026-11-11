// Ported from Z3 (src/util/util.h), MIT license, see z3-license.txt.
export class RandomGen {
  constructor(private seed: number) {}

  next() {
    this.seed = (Math.imul(this.seed, 214013) + 2531011) >>> 0;
    return (this.seed >>> 16) & 0x7fff;
  }
}

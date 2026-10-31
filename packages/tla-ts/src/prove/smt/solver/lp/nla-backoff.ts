// Ported from Z3 (src/math/lp/nla_backoff.h), MIT license, see z3-license.txt. When the core runs
// its expensive engines.

// backoff: how many calls to skip before the next run of an expensive engine.
export class Backoff {
  private delay = 0;

  constructor(private delayBound: number) {}

  shouldRun() {
    if (this.delay > 0) this.delay--;
    return this.delay < 2;
  }

  update(isSuccess: boolean) {
    if (isSuccess) this.delayBound = Math.floor(this.delayBound / 2);
    else if (this.delayBound < 1 << 20) this.delayBound = Math.max(2 * this.delayBound, 1);
    this.delay = this.delayBound;
  }
}

// squeeze_schedule: when to run the bounds optimization of the monomials.
export class SqueezeSchedule {
  private failStreak = 0;
  private squeezesSinceSatCheck = 0;

  get isEnabled() {
    return this.squeezesSinceSatCheck < 50;
  }

  get isEager() {
    return this.failStreak < 3;
  }

  onSqueeze(isImproved: boolean) {
    this.squeezesSinceSatCheck++;
    this.failStreak = isImproved ? 0 : this.failStreak + 1;
  }

  onNothingToRefine() {
    this.squeezesSinceSatCheck = Math.floor(this.squeezesSinceSatCheck / 2);
  }
}

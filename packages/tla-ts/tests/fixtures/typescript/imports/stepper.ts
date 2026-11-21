import { StepError } from "./step-error.ts";

export class Stepper {
  constructor(private value: number) {}

  step() {
    if (this.value < 0) throw new StepError("negative");
    this.value = this.value * 2 + 1;
    return this.value;
  }
}

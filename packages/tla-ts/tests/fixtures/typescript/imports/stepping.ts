import { Stepper } from "./stepper";

const stepper = new Stepper(1);
const first = stepper.step();
const second = stepper.step();
if (first !== 3 || second !== 7) throw new Error("stepped");

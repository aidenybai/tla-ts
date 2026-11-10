// A port of SingleLaneBridge.tla, checked with MC.tla, from tlaplus/Examples.
type Car = "r1" | "r2" | "l1" | "l2";

const carsRight = new Set<Car>(["r1", "r2"]);
const carsLeft = new Set<Car>(["l1", "l2"]);
const cars = carsRight.union(carsLeft);
const bridge = new Set([4, 5]);
const startPos = 1;
const endPos = 8;
const startBridge = 4;
const endBridge = 5;

let Location: Record<Car, number> = { r1: endPos, r2: endPos, l1: startPos, l2: startPos };
let WaitingBeforeBridge: Car[] = [];

const getCarsInBridge = () => new Set(cars.values().filter((car) => bridge.has(Location[car])));

const rMove = (pos: number) => (pos > startPos ? pos - 1 : endPos);
const lMove = (pos: number) => (pos < endPos ? pos + 1 : startPos);

const nextLocation = (car: Car) =>
  carsRight.has(car) ? rMove(Location[car]) : lMove(Location[car]);

const isFree = (pos: number) => cars.values().every((car) => Location[car] !== pos);

const changeLocation = (car: Car) => {
  const next = nextLocation(car);
  if (
    (carsRight.has(car) && next === endBridge + 1) ||
    (carsLeft.has(car) && next === startBridge - 1)
  ) {
    WaitingBeforeBridge.push(car);
  }
  Location[car] = next;
};

const haveSameDirection = (car: Car) =>
  (carsRight.has(car) && getCarsInBridge().isSubsetOf(carsRight)) ||
  (carsLeft.has(car) && getCarsInBridge().isSubsetOf(carsLeft));

/** @fair */
export const moveOutsideBridge = (car: Car) => {
  if (bridge.has(nextLocation(car))) return;
  changeLocation(car);
};

/** @fair */
export const moveInsideBridge = (car: Car) => {
  if (!getCarsInBridge().has(car) || !isFree(nextLocation(car))) return;
  changeLocation(car);
};

// Next tries EnterBridge once for each car, so it takes a car it doesn't use.
/** @fair */
export const enterBridge = (_car: Car) => {
  if (WaitingBeforeBridge.length === 0) return;
  const head = WaitingBeforeBridge[0];
  if (
    getCarsInBridge().size === 0 ||
    (!getCarsInBridge().has(head) && haveSameDirection(head) && isFree(nextLocation(head)))
  ) {
    Location[head] = nextLocation(head);
    WaitingBeforeBridge.shift();
  }
};

export const invariants = () =>
  cars
    .values()
    .every((first) =>
      cars
        .values()
        .every(
          (second) =>
            !(bridge.has(Location[first]) && Location[first] === Location[second]) ||
            first === second,
        ),
    ) &&
  getCarsInBridge().size < bridge.size + 1 &&
  carsRight
    .values()
    .every((right) =>
      carsLeft
        .values()
        .every((left) => !(bridge.has(Location[right]) && bridge.has(Location[left]))),
    );

const isInBridge = (car: Car) => bridge.has(Location[car]);
const isOutsideBridge = (car: Car) => !isInBridge(car);

/** @leadsTo isOutsideBridge */
export const carsInBridgeExit = (car: Car) => isInBridge(car);

/** @leadsTo isInBridge */
export const carsEnterBridge = (car: Car) => isOutsideBridge(car);

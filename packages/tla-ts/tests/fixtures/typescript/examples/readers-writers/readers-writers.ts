// A port of ReadersWriters.tla from tlaplus/Examples, with two actors where MC.tla has three.
type Actor = 1 | 2;
type Access = "read" | "write";

const actors = new Set<Actor>([1, 2]);

let readers = new Set<Actor>();
let writers = new Set<Actor>();
let waiting: [Access, Actor][] = [];

const getWaiting = (access: Access) =>
  new Set(waiting.filter((request) => request[0] === access).map((request) => request[1]));

/** @fair */
export const tryRead = (actor: Actor) => {
  if (getWaiting("read").has(actor)) return;
  waiting.push(["read", actor]);
};

/** @fair */
export const tryWrite = (actor: Actor) => {
  if (getWaiting("write").has(actor)) return;
  waiting.push(["write", actor]);
};

/** @fair */
export const readOrWrite = () => {
  if (waiting.length === 0 || writers.size !== 0) return;
  const request = waiting[0];
  if (request[0] === "write" && readers.size !== 0) return;
  waiting.shift();
  if (request[0] === "read") readers.add(request[1]);
  else writers.add(request[1]);
};

/** @fair */
export const stop = (actor: Actor) => {
  if (!readers.union(writers).has(actor)) return;
  if (readers.has(actor)) readers.delete(actor);
  else writers.delete(actor);
};

export const typeOK = () =>
  readers.isSubsetOf(actors) &&
  writers.isSubsetOf(actors) &&
  waiting.every(
    (request) => (request[0] === "read" || request[0] === "write") && actors.has(request[1]),
  );

export const safety = () => !(readers.size !== 0 && writers.size !== 0) && writers.size <= 1;

/** @alwaysEventually */
export const reads = (actor: Actor) => readers.has(actor);

/** @alwaysEventually */
export const writes = (actor: Actor) => writers.has(actor);

/** @alwaysEventually */
export const stopsReading = (actor: Actor) => !readers.has(actor);

/** @alwaysEventually */
export const stopsWriting = (actor: Actor) => !writers.has(actor);

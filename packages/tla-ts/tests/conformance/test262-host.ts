// test262's $262, with only the members that tla-ts can model, so that a test that reads another
// fails to type check. gc collects nothing, as a host's may. detachArrayBuffer detaches through
// ArrayBuffer.prototype.transfer, and leaves a detached buffer as it is, as DetachArrayBuffer does. A
// shared buffer, which has no transfer, throws a TypeError, as engines' hosts do. createRealm gives
// the global of a new realm, which the host's own $262 on its global makes, as Node's vm makes a new
// context, and none of the realm's other members.

// oxlint-disable-next-line no-unused-vars
const $262 = {
  gc: () => {},
  detachArrayBuffer(buffer: ArrayBufferLike) {
    const arrayBuffer = buffer as ArrayBuffer;
    if (!arrayBuffer.detached) arrayBuffer.transfer();
  },
  createRealm: () => ({
    global: (
      globalThis as unknown as { $262: { createRealm(): typeof globalThis } }
    ).$262.createRealm(),
  }),
};

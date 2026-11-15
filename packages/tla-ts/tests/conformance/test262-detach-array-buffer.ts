// test262's harness/detachArrayBuffer.js, typed so that tla-ts can compile it. The host always
// defines $262.detachArrayBuffer, which the original checks first.

// oxlint-disable-next-line no-unused-vars
function $DETACHBUFFER(buffer: ArrayBufferLike) {
  $262.detachArrayBuffer(buffer);
}

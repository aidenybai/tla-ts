/// <reference types="node" />
export {};

// As TypeScript's isNodeLikeSystem tells whether it runs in Node, where an ES module has no require.
const isNode = typeof process !== "undefined" && typeof require !== "undefined";
const kinds = [typeof process, typeof Buffer, typeof require, typeof module, typeof __filename];
const seen = `${kinds.join()} ${isNode}`;
if (seen !== "object,function,undefined,undefined,undefined false") {
  throw new Error("seen " + seen);
}

import { findStringRank, type Value } from "./values";

// A state written as a stream of tokens, so that trying a permutation allocates nothing. A token
// packs a tag above a 32-bit integer: a number or boolean, the rank of a string or model value, the
// size of a set, which its elements follow, or of a function, which its keys and then its values
// follow, or the shape of a record, which its values follow. Reading two streams in order orders
// them as compareValues orders the values, as long as the tags match. A record has its own tag, as
// compareFunctions compares a record with another function differently, and its keys are one token
// since no permutation moves them.
const TAG_NUMBER = 0;
const TAG_BOOLEAN = 1;
const TAG_STRING = 2;
const TAG_MODEL_VALUE = 3;
const TAG_SET = 4;
const TAG_FUNCTION = 5;
const TAG_RECORD = 6;

const TAG_UNIT = 2 ** 32;
const INTEGER_OFFSET = 2 ** 31;

const createToken = (tag: number, integer: number) => tag * TAG_UNIT + integer + INTEGER_OFFSET;
const getTag = (token: number) => Math.floor(token / TAG_UNIT);
const getInteger = (token: number) => token - getTag(token) * TAG_UNIT - INTEGER_OFFSET;

const MODEL_VALUE_ZERO = createToken(TAG_MODEL_VALUE, 0);

export interface StateImages {
  // The position in the group of the permutation that gives the smallest image of the state, -1 if
  // the state is its own smallest image, or undefined if it holds a value that can't be written as
  // tokens, or whose images compare in a way only compareValues decides. It calls onReach with each
  // variable that some permutation reaches, since TLC permutes it.
  findSmallest: (
    state: Value[],
    order: number[],
    onReach: (value: Value) => void,
  ) => number | undefined;
  // Whether the permutation at a position moves a value of a variable of the last state.
  isVariableMoved: (variable: number, permutation: number) => boolean;
}

// A bit for each model value a permutation moves, which they share if there are more than 31, so
// that a variable and a permutation with no bit in common leave each other alone.
const getRankBits = (permutations: Int32Array[]) => {
  const bits = new Int32Array(Math.max(0, ...permutations.map((ranks) => ranks.length)));
  let bitCount = 0;
  for (const ranks of permutations) {
    for (let rank = 0; rank < ranks.length; rank++) {
      if (ranks[rank] !== rank && bits[rank] === 0) bits[rank] = 1 << (bitCount++ % 31);
    }
  }
  return bits;
};

export const createStateImages = (permutations: Int32Array[]): StateImages => {
  let capacity = 256;
  let source = new Float64Array(capacity);
  // For a value that a permutation only relabels, the number of its tokens. For a function with a
  // value that a permutation reorders, the negated number of its keys' tokens, if they keep their
  // order. Otherwise 0.
  let spans = new Int32Array(capacity);
  let smallest = new Float64Array(capacity);
  let image = new Float64Array(capacity);
  let unsorted = new Float64Array(capacity);
  // A stack of the children of the sets and functions being written, which fit in their tokens.
  let childStarts = new Int32Array(capacity + 1);
  let childOrder = new Int32Array(capacity + 1);
  const rankBits = getRankBits(permutations);
  const permutationMasks = Int32Array.from(permutations, (ranks) =>
    ranks.reduce((mask, image, rank) => (image === rank ? mask : mask | rankBits[rank]), 0),
  );
  // Where each variable starts in the buffers, and the bits of the model values it holds.
  let offsets = new Int32Array(1);
  let variableMasks = new Int32Array(0);
  let valueMask = 0;
  let sourceLength = 0;
  let modelValueCount = 0;
  let reorderedCount = 0;
  let cursor = 0;
  let frameEnd = 0;
  let isComparable = true;
  // A trie of the records' key ranks, whose nodes are their shapes, with the empty record at 0.
  const shapeChildren = [new Map<number, number>()];
  // Most shapes have one child, whose key this reads without looking it up.
  const shapeFirstRanks = [-1];
  const shapeFirstChildren = [0];
  const shapeParents = [0];
  const shapeRanks = [0];
  const shapeSizes = [0];
  // Most images lose to the smallest, so a variable's own children are put in order only if it might
  // not. These hold the children left to reorder.
  let isReorderDeferred = false;
  let deferredCount = 0;
  let deferredBlocks = 0;

  const growSource = () => {
    capacity *= 2;
    const grownSource = new Float64Array(capacity);
    const grownSpans = new Int32Array(capacity);
    grownSource.set(source);
    grownSpans.set(spans);
    source = grownSource;
    spans = grownSpans;
  };

  const writeToken = (tag: number, integer: number, span: number) => {
    if (sourceLength === capacity) growSource();
    source[sourceLength] = createToken(tag, integer);
    spans[sourceLength] = span;
    return sourceLength++;
  };

  const getShape = (keys: Value[]) => {
    let shape = 0;
    for (const key of keys) {
      const rank = typeof key === "string" ? findStringRank(key) : undefined;
      if (rank === undefined) return undefined;
      if (shapeFirstRanks[shape] === rank) {
        shape = shapeFirstChildren[shape];
        continue;
      }
      const known = shapeChildren[shape].get(rank);
      if (known !== undefined) {
        shape = known;
        continue;
      }
      const child = shapeChildren.length;
      if (shapeFirstRanks[shape] === -1) {
        shapeFirstRanks[shape] = rank;
        shapeFirstChildren[shape] = child;
      }
      shapeChildren[shape].set(rank, child);
      shapeChildren.push(new Map());
      shapeFirstRanks.push(-1);
      shapeFirstChildren.push(0);
      shapeParents.push(shape);
      shapeRanks.push(rank);
      shapeSizes.push(shapeSizes[shape] + 1);
      shape = child;
    }
    return shape;
  };

  // Orders two shapes by their sizes and then by the first key that differs.
  const compareShapes = (left: number, right: number) => {
    const sizes = shapeSizes[left] - shapeSizes[right];
    if (sizes !== 0) return sizes;
    let comparison = 0;
    let leftShape = left;
    let rightShape = right;
    while (leftShape !== rightShape) {
      if (shapeRanks[leftShape] !== shapeRanks[rightShape]) {
        comparison = shapeRanks[leftShape] - shapeRanks[rightShape];
      }
      leftShape = shapeParents[leftShape];
      rightShape = shapeParents[rightShape];
    }
    return comparison;
  };

  const writeValues = (values: Value[]) => {
    for (const value of values) if (!writeValue(value)) return false;
    return true;
  };

  const writeValue = (value: Value): boolean => {
    if (typeof value === "number") {
      if ((value | 0) !== value) return false;
      writeToken(TAG_NUMBER, value, 1);
      return true;
    }
    if (typeof value === "boolean") {
      writeToken(TAG_BOOLEAN, value ? 1 : 0, 1);
      return true;
    }
    if (typeof value === "string") {
      const rank = findStringRank(value);
      if (rank === undefined) return false;
      writeToken(TAG_STRING, rank, 1);
      return true;
    }
    if (value.kind === "ModelValue") {
      if (value.type !== undefined) return false;
      writeToken(TAG_MODEL_VALUE, value.rank, 1);
      modelValueCount++;
      if (value.rank < rankBits.length) valueMask |= rankBits[value.rank];
      return true;
    }
    const modelValuesBefore = modelValueCount;
    const reorderedBefore = reorderedCount;
    if (value.kind === "Set") {
      const start = writeToken(TAG_SET, value.elements.length, 0);
      if (!writeValues(value.elements)) return false;
      if (modelValueCount !== modelValuesBefore) reorderedCount++;
      spans[start] = reorderedCount === reorderedBefore ? sourceLength - start : 0;
      return true;
    }
    if (value.kind !== "Function") return false;
    if (value.domain.every((key) => typeof key === "string")) {
      const shape = getShape(value.domain);
      if (shape === undefined) return false;
      const start = writeToken(TAG_RECORD, shape, 0);
      if (!writeValues(value.range)) return false;
      if (reorderedCount === reorderedBefore) spans[start] = sourceLength - start;
      return true;
    }
    const start = writeToken(TAG_FUNCTION, value.domain.length, 0);
    if (!writeValues(value.domain)) return false;
    const keysLength = sourceLength - start - 1;
    const isKeysFixed = modelValueCount === modelValuesBefore;
    if (!writeValues(value.range)) return false;
    if (!isKeysFixed) reorderedCount++;
    spans[start] =
      reorderedCount === reorderedBefore ? sourceLength - start : isKeysFixed ? -keysLength : 0;
    return true;
  };

  const compareTokens = (
    left: Float64Array,
    leftStart: number,
    right: Float64Array,
    rightStart: number,
    length: number,
  ) => {
    for (let offset = 0; offset < length; offset++) {
      const leftToken = left[leftStart + offset];
      const rightToken = right[rightStart + offset];
      if (leftToken === rightToken) continue;
      const tag = getTag(leftToken);
      if (tag !== getTag(rightToken)) {
        isComparable = false;
        return 0;
      }
      if (tag === TAG_RECORD) return compareShapes(getInteger(leftToken), getInteger(rightToken));
      return leftToken < rightToken ? -1 : 1;
    }
    return 0;
  };

  const compareChildren = (frame: number, left: number, right: number) => {
    const starts = childStarts;
    const written = image;
    const leftStart = starts[frame + left];
    return compareTokens(
      written,
      leftStart,
      written,
      starts[frame + right],
      starts[frame + left + 1] - leftStart,
    );
  };

  // Sorts the children of a set or function by their first block of tokens, and reports whether any
  // moved. They are usually nearly sorted, so each is first compared with the largest so far.
  const sortChildren = (frame: number, count: number) => {
    const order = childOrder;
    let isMoved = false;
    order[frame] = 0;
    for (let child = 1; child < count; child++) {
      if (compareChildren(frame, order[frame + child - 1], child) <= 0) {
        order[frame + child] = child;
        continue;
      }
      isMoved = true;
      let low = 0;
      let high = child - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (compareChildren(frame, order[frame + middle], child) <= 0) low = middle + 1;
        else high = middle;
      }
      for (let index = child; index > low; index--) order[frame + index] = order[frame + index - 1];
      order[frame + low] = child;
    }
    return isMoved;
  };

  // Writes the children in their sorted order. A function has two blocks of children, its keys and
  // then its values, which move together.
  const reorderChildren = (frame: number, count: number, blocks: number) => {
    const starts = childStarts;
    const order = childOrder;
    const written = image;
    const copy = unsorted;
    const start = starts[frame];
    const end = starts[frame + count * blocks];
    for (let index = start; index < end; index++) copy[index] = written[index];
    let target = start;
    for (let block = 0; block < blocks; block++) {
      const blockFrame = frame + block * count;
      for (let position = 0; position < count; position++) {
        const child = order[frame + position];
        const childEnd = starts[blockFrame + child + 1];
        for (let index = starts[blockFrame + child]; index < childEnd; index++) {
          written[target++] = copy[index];
        }
      }
    }
  };

  const finishChildren = (frame: number, count: number, blocks: number) => {
    if (!sortChildren(frame, count)) return;
    if (frame === 0 && isReorderDeferred) {
      deferredCount = count;
      deferredBlocks = blocks;
      return;
    }
    reorderChildren(frame, count, blocks);
  };

  // Compares the image at start with the smallest, reading its children in their sorted order.
  const compareDeferred = (start: number) => {
    const starts = childStarts;
    const order = childOrder;
    const header = compareTokens(image, start, smallest, start, starts[0] - start);
    if (header !== 0 || !isComparable) return header;
    let target = starts[0];
    for (let block = 0; block < deferredBlocks; block++) {
      const blockFrame = block * deferredCount;
      for (let position = 0; position < deferredCount; position++) {
        const child = order[position];
        const childStart = starts[blockFrame + child];
        const length = starts[blockFrame + child + 1] - childStart;
        const comparison = compareTokens(image, childStart, smallest, target, length);
        if (comparison !== 0 || !isComparable) return comparison;
        target += length;
      }
    }
    return 0;
  };

  const relabel = (token: number, ranks: Int32Array) => {
    const rank = token - MODEL_VALUE_ZERO;
    return rank >= 0 && rank < ranks.length ? MODEL_VALUE_ZERO + ranks[rank] : token;
  };

  const writeChildren = (
    position: number,
    frame: number,
    count: number,
    ranks: Int32Array,
  ): number => {
    let next = position;
    for (let child = 0; child < count; child++) {
      childStarts[frame + child] = cursor;
      if (spans[next] === 1) image[cursor++] = relabel(source[next++], ranks);
      else next = writeImage(next, ranks);
    }
    childStarts[frame + count] = cursor;
    return next;
  };

  // V8 reloads a captured variable on every use, so this loop reads them into constants first.
  const copyRelabeled = (position: number, length: number, ranks: Int32Array) => {
    const from = source;
    const to = image;
    const target = cursor;
    for (let offset = 0; offset < length; offset++) {
      to[target + offset] = relabel(from[position + offset], ranks);
    }
    cursor = target + length;
  };

  // Writes the image of the value at position, and returns the position after the value.
  const writeImage = (position: number, ranks: Int32Array): number => {
    const span = spans[position];
    if (span > 0) {
      copyRelabeled(position, span, ranks);
      return position + span;
    }
    const token = source[position];
    image[cursor++] = token;
    const tag = getTag(token);
    const integer = getInteger(token);
    const frame = frameEnd;
    if (tag === TAG_RECORD) {
      const size = shapeSizes[integer];
      frameEnd += size + 1;
      const next = writeChildren(position + 1, frame, size, ranks);
      frameEnd = frame;
      return next;
    }
    if (tag === TAG_SET) {
      frameEnd += integer + 1;
      const next = writeChildren(position + 1, frame, integer, ranks);
      finishChildren(frame, integer, 1);
      frameEnd = frame;
      return next;
    }
    if (span < 0) {
      copyRelabeled(position + 1, -span, ranks);
      frameEnd += integer + 1;
      const next = writeChildren(position + 1 - span, frame, integer, ranks);
      frameEnd = frame;
      return next;
    }
    frameEnd += 2 * integer + 1;
    const keysEnd = writeChildren(position + 1, frame, integer, ranks);
    const next = writeChildren(keysEnd, frame + integer, integer, ranks);
    finishChildren(frame, integer, 2);
    frameEnd = frame;
    return next;
  };

  // Writes a variable of the image of the smallest permutation, which it left unwritten.
  const writeSmallest = (variable: number, permutation: number) => {
    const start = offsets[variable];
    if ((variableMasks[variable] & permutationMasks[permutation]) === 0) {
      const end = offsets[variable + 1];
      for (let index = start; index < end; index++) smallest[index] = source[index];
      return;
    }
    const held = image;
    image = smallest;
    cursor = start;
    frameEnd = 0;
    deferredBlocks = 0;
    isReorderDeferred = false;
    writeImage(start, permutations[permutation]);
    image = held;
  };

  const prepareBuffers = () => {
    if (smallest.length < capacity) {
      smallest = new Float64Array(capacity);
      image = new Float64Array(capacity);
      unsorted = new Float64Array(capacity);
      childStarts = new Int32Array(capacity + 1);
      childOrder = new Int32Array(capacity + 1);
    }
    const from = source;
    const toSmallest = smallest;
    const toImage = image;
    for (let index = 0; index < sourceLength; index++) {
      toSmallest[index] = from[index];
      toImage[index] = from[index];
    }
  };

  return {
    findSmallest: (state, order, onReach) => {
      sourceLength = 0;
      modelValueCount = 0;
      reorderedCount = 0;
      if (variableMasks.length !== state.length) {
        offsets = new Int32Array(state.length + 1);
        variableMasks = new Int32Array(state.length);
      }
      for (let variable = 0; variable < state.length; variable++) {
        offsets[variable] = sourceLength;
        valueMask = 0;
        if (!writeValue(state[variable])) return undefined;
        variableMasks[variable] = valueMask;
      }
      offsets[state.length] = sourceLength;
      prepareBuffers();
      isComparable = true;
      let found = -1;
      let reached = -1;
      // How many variables, in order, of the smallest image are written. A later permutation usually
      // loses before it reads the rest, so the rest are written only when one ties that far. TLC
      // likewise sorts a permuted value only when it compares or fingerprints it.
      let smallestEnd = order.length;
      for (let permutation = 0; permutation < permutations.length; permutation++) {
        const ranks = permutations[permutation];
        const permutationMask = permutationMasks[permutation];
        for (let position = 0; position < order.length; position++) {
          const variable = order[position];
          if (position > reached) {
            reached = position;
            onReach(state[variable]);
          }
          const variableMask = variableMasks[variable];
          if (variableMask === 0) continue;
          if (position >= smallestEnd) {
            writeSmallest(variable, found);
            smallestEnd = position + 1;
            if (!isComparable) return undefined;
          }
          const start = offsets[variable];
          const isMoved = (variableMask & permutationMask) !== 0;
          if (isMoved) {
            cursor = start;
            frameEnd = 0;
            deferredBlocks = 0;
            isReorderDeferred = true;
            writeImage(start, ranks);
            if (!isComparable) return undefined;
          }
          const length = offsets[variable + 1] - start;
          const comparison = !isMoved
            ? compareTokens(source, start, smallest, start, length)
            : deferredBlocks === 0
              ? compareTokens(image, start, smallest, start, length)
              : compareDeferred(start);
          if (!isComparable) return undefined;
          if (comparison > 0) break;
          if (isMoved && deferredBlocks !== 0) reorderChildren(0, deferredCount, deferredBlocks);
          if (comparison === 0) continue;
          found = permutation;
          smallestEnd = position + 1;
          for (let earlier = 0; earlier <= position; earlier++) {
            const earlierVariable = order[earlier];
            const earlierMask = variableMasks[earlierVariable];
            if (earlierMask === 0 || (earlierMask & permutationMask) !== 0) continue;
            const end = offsets[earlierVariable + 1];
            for (let index = offsets[earlierVariable]; index < end; index++) {
              image[index] = source[index];
            }
          }
          const previous = smallest;
          smallest = image;
          image = previous;
          for (let rest = position + 1; rest < order.length; rest++) {
            if (rest > reached) {
              reached = rest;
              onReach(state[order[rest]]);
            }
          }
          break;
        }
      }
      return found;
    },
    isVariableMoved: (variable, permutation) =>
      (variableMasks[variable] & permutationMasks[permutation]) !== 0,
  };
};

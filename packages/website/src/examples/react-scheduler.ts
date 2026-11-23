// From React's scheduler: packages/scheduler/src/SchedulerMinHeap.js.
// The scheduler keeps its tasks in a heap, with the most urgent task first.
type Priority = 1 | 2 | 3;

let heap: number[] = [];

const siftUp = (node: number, start: number) => {
  let index = start;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (parent - node > 0) {
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
};

const siftDown = (node: number, start: number) => {
  let index = start;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];
    if (left - node < 0) {
      if (rightIndex < length && right - left < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && right - node < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
};

export const push = (node: Priority) => {
  if (heap.length >= 4) return;
  const index = heap.length;
  heap.push(node);
  siftUp(node, index);
};

export const pop = () => {
  if (heap.length === 0) return;
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(last, 0);
  }
};

export const peekIsSmallest = () => heap.every((node) => heap[0] <= node);

export interface Level {
  value: number;
}

export const levels: number[] = [];
const getLast = () => levels[levels.length - 1];
for (let level = levels.pop(); level !== undefined; level = levels.pop()) levels.push(getLast());

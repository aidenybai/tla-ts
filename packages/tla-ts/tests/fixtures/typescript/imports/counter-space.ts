// A namespace whose body keeps a variable and runs a statement, as TypeScript emits it, once.
export const log: string[] = [];

export namespace Counter {
  let count = 0;
  log.push("ran");
  export function bump() {
    count += 1;
    return count;
  }
}

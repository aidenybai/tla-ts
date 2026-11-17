// An overloaded function that a module's top level calls, which changes what an importer reads.
export const names: string[] = [];

export function register(name: string): number;
export function register(name: string, rank: number): number;
export function register(name: string, rank = 0): number {
  names.push(name);
  return rank;
}

export const first = register("first");

export interface Combiner<A> {
  combine: (self: A, that: A) => A;
  initialValue: A;
}

export function make<A>(combine: (self: A, that: A) => A, initialValue: A): Combiner<A> {
  return { combine, initialValue };
}

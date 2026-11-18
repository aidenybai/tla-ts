export interface Hook {
  count: number;
}

export const makeHook = (): Hook => ({ count: 0 });

declare global {
  var hookX: Hook | undefined;
}

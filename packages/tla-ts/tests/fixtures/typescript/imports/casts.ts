import * as values from "./exports";

export const getCast = () =>
  [(values as any).limit, (<any>values).renamed, (values satisfies object).limit].join();

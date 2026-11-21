import { createContext, use } from "react";

export const createPartsContext = <Value>(rootName: string) => {
  const PartsContext = createContext<Value | undefined>(undefined);
  const useParts = () => {
    const value = use(PartsContext);
    if (value === undefined) throw new Error(`Render this part inside ${rootName}.`);
    return value;
  };
  return { PartsContext, useParts };
};

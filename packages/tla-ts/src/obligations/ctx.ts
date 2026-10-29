// tlapm's Ctx, which names each binder apart from the names in scope by adding a salt, as a
// mutable stack: printers bind and unbind names in strict nesting order.

interface Ident {
  rep: string;
  salt: number;
}

export interface Context {
  stack: Ident[];
  idents: Map<string, Ident[]>;
  defined: Map<string, number>;
}

const getIdentName = (ident: Ident) =>
  ident.salt === 0 ? ident.rep : `${ident.rep}_${ident.salt}`;

export const createContext = (): Context => ({
  stack: [],
  idents: new Map(),
  defined: new Map(),
});

// The name of the binder index places in, counting from 1 for the innermost.
export const getBoundName = (context: Context, index: number) => {
  const ident = context.stack[context.stack.length - index];
  return ident && getIdentName(ident);
};

export const pushName = (context: Context, rep: string) => {
  const previous = context.idents.get(rep)?.at(-1);
  let ident: Ident = previous ? { rep, salt: previous.salt + 1 } : { rep, salt: 0 };
  while (context.defined.has(getIdentName(ident))) ident = { rep, salt: ident.salt + 1 };
  context.stack.push(ident);
  const idents = context.idents.get(rep);
  if (idents) idents.push(ident);
  else context.idents.set(rep, [ident]);
  const key = getIdentName(ident);
  context.defined.set(key, (context.defined.get(key) ?? 0) + 1);
  return key;
};

export const popNames = (context: Context, count: number) => {
  for (let index = 0; index < count; index++) {
    const ident = context.stack.pop();
    if (!ident) return;
    context.idents.get(ident.rep)?.pop();
    const key = getIdentName(ident);
    const remaining = (context.defined.get(key) ?? 1) - 1;
    if (remaining === 0) context.defined.delete(key);
    else context.defined.set(key, remaining);
  }
};

export const withNames = <Result>(
  context: Context,
  names: string[],
  body: (idents: string[]) => Result,
) => {
  const idents = names.map((name) => pushName(context, name));
  const result = body(idents);
  popNames(context, names.length);
  return result;
};

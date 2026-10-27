# tsprover

Model check TypeScript. You write a model as a plain TypeScript module, and tsprover checks every reachable state of it. tsprover compiles the module to TLA+ and checks it with [tla-ts](https://github.com/aidenybai/tla-ts), which matches TLC's semantics without a JVM.

```ts
// bank.proof.ts
type Account = "alice" | "bob";

let balances: Record<Account, number> = { alice: 10, bob: 10 };

export const transfer = (from: Account, to: Account, amount: 1 | 2 | 3) => {
  balances[from] -= amount;
  balances[to] += amount;
};

export const noOverdraft = () => balances.alice >= 0 && balances.bob >= 0;
```

```sh
npx tsprover
```

```
✗ bank.proof.ts: invariant noOverdraft is violated
  1. Initial state
     balances = { alice: 10, bob: 10 }
  2. transfer
     balances = { alice: 12, bob: 8 }
  3. transfer
     balances = { alice: 15, bob: 5 }
  4. transfer
     balances = { alice: 18, bob: 2 }
  5. transfer
     balances = { alice: 21, bob: -1 }
```

Add `if (balances[from] < amount) return;` at the top of `transfer`, and all 21 reachable states pass.

## Install

```sh
npm install --save-dev tsprover
```

## CLI

```sh
tsprover [files...]
```

With no files, tsprover checks every `*.proof.ts` file under the current directory, skipping `node_modules`. It exits with 1 when any check fails.

| Option                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `-w, --workers <count>` | Check with this many worker threads. Default: 1.    |
| `--emit`                | Print the generated TLA+ spec and config, and exit. |

## Writing a model

A model is a module. Its top-level declarations become the spec.

| TypeScript                                     | TLA+                                              |
| ---------------------------------------------- | ------------------------------------------------- |
| `let count = 0;`                               | A variable that starts at 0                       |
| `let bit: 0 \| 1;`                             | A variable that starts at every value of its type |
| `const N = 3;`, or a function you don't export | A definition                                      |
| An exported function that changes state        | An action, which `Next` chooses from              |
| An exported function that returns a boolean    | An invariant                                      |
| A parameter, such as `(proc: Proc)`            | `\E proc \in Proc`, every value of its type       |
| `if (busy) return;` before any change          | A condition that disables the action              |

An action runs its statements in order, as TypeScript does. A read after an assignment sees the new value. Each path through the action that changes state is one possible step, and a path that changes nothing disables the action.

```ts
type Proc = "p1" | "p2" | "p3";

let owner: Proc | null = null;
let waiting = new Set<Proc>();

export const request = (proc: Proc) => {
  if (owner === proc) return;
  waiting.add(proc);
};

export const acquire = (proc: Proc) => {
  if (!waiting.has(proc) || owner !== null) return;
  waiting.delete(proc);
  owner = proc;
};

export const release = () => {
  if (owner === null) return;
  owner = null;
};

export const isExclusive = () => owner === null || !waiting.has(owner);
```

### Finite types

TLC tries every value of a parameter's type, so a parameter needs a finite type.

| TypeScript type                | Values                                  |
| ------------------------------ | --------------------------------------- |
| `"a" \| "b"`, `1 \| 2`, enums  | Each literal                            |
| `boolean`, `null`, `undefined` | `true` and `false`, `null`, `undefined` |
| `{ x: 0 \| 1; y: boolean }`    | Every record of those fields            |
| `[0 \| 1, boolean]`            | Every tuple of those elements           |
| `Set<T>`                       | Every subset of `T`'s values            |
| `Map<K, V>`                    | Every partial function from `K` to `V`  |

`number`, `string`, and arrays have no end, so tsprover rejects them as parameter types. A parameter of any type works when the action starts with a guard such as `if (!pending.has(message)) return;`. tsprover then chooses the parameter from that set. A later guard's set may use a parameter an earlier guard chose, as in `if (!getMoves(from).has(to)) return;`.

### Values

| TypeScript                              | TLA+                                           |
| --------------------------------------- | ---------------------------------------------- |
| Integers, strings, booleans             | Integers, strings, `TRUE` and `FALSE`          |
| `null`, `undefined`                     | The model values `Null` and `Undefined`        |
| `{ a: 1, b: x }`, `{ ...r, a: 2 }`      | Records, `[r EXCEPT !.a = 2]`                  |
| `[a, b]`, `xs[i]`, `xs.length`          | Sequences, `xs[i + 1]`, `Len(xs)`              |
| `new Set([a, b])`, `s.has(x)`, `s.size` | Sets, `x \in s`, `Cardinality(s)`              |
| `new Map([[k, v]])`, `m.get(k)!`        | Functions, `m[k]`                              |
| `Record<K, V>`, `r[k]`                  | Records, `r[k]`, or functions for numeric keys |

`===` compares values, not references, so two sets with the same elements are equal. Sets keep no order.

### Operations

- **Numbers:** `+`, `-`, `*`, `**`, `%`, comparisons, `Math.floor(a / b)`, `Math.trunc(a / b)`, `Math.min`, `Math.max`, and `Math.abs`. `%` keeps JavaScript's sign. Write division with `Math.floor` or `Math.trunc`.
- **Strings:** `+` and template literals.
- **Arrays:** `at`, `includes`, `indexOf`, `slice`, `concat`, `with`, `toReversed`, `map`, `filter`, `every`, `some`, `find`, `findIndex`, spreads, `Array.from({ length: n }, (_, i) => …)`, and `Array(n).fill(v)`.
- **Sets:** `has`, `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, and `isDisjointFrom`. `[...s]` and `s.values()` take `every`, `some`, `filter`, `map`, and `find`. `find` on a set returns an arbitrary match that is the same on every call.
- **Maps and records:** `get`, `has`, `size`, `keys()`, `values()`, `entries()`, `Object.keys`, `Object.values`, `Object.entries`, and `new Map(s.values().map((k) => [k, v]))` or `Object.fromEntries(…)` to build one from a set.
- **Changes in actions:** assignments to variables and their fields, destructuring such as `[a, b] = [b, a]`, `++`, `--`, `+=`, `-=`, `*=`, `push`, `pop`, `shift`, `unshift`, `add`, `delete`, `set`, and `clear`. Changes reach through lookups, as in `held.get(proc)!.add(fork)`. `const head = queue.shift()!` reads the first element and removes it.
- **Control flow:** `if`, `else`, `switch`, `return`, `?:`, `const` and `let` locals, and local arrow functions. Use `map`, `filter`, `every`, `some`, or a parameter in place of loops.
- **Output:** `console.log` prints, `console.assert(condition, message)` and `throw new Error(message)` stop the check with an error.

### Helpers and imports

A function you don't export becomes a TLA+ operator, and it may call itself. An action may call a helper that changes state. tsprover inlines that helper. Pass a helper by name where a callback goes, as in `procs.values().some(isWaiting)`.

Import types from anywhere, and constants and functions from other TypeScript files. tsprover compiles what you import into the spec. A model can't import values from packages that ship only compiled JavaScript.

### Properties, fairness, and options

JSDoc tags cover what TypeScript has no syntax for.

| Tag                    | On                             | Meaning                                            |
| ---------------------- | ------------------------------ | -------------------------------------------------- |
| `@fair`, `@strongFair` | An action                      | Weak or strong fairness, for each parameter value  |
| `@initially`           | A boolean function             | Start only in states where it holds                |
| `@eventually`          | A boolean function             | It holds at some point                             |
| `@alwaysEventually`    | A boolean function             | It holds infinitely often                          |
| `@eventuallyAlways`    | A boolean function             | It holds forever from some point                   |
| `@leadsTo other`       | A boolean function             | Whenever it holds, `other` holds later             |
| `@always`              | A boolean function of `before` | Every step satisfies it                            |
| `@constraint`          | A boolean function             | Don't explore past states that fail it             |
| `@actionConstraint`    | A boolean function of `before` | Don't take steps that fail it                      |
| `@view`                | A function                     | Count states as equal when it returns equal values |
| `@assume`              | A boolean function             | Check it once before the search                    |
| `@postcondition`       | A boolean function             | Check it after the search                          |
| `@symmetric`           | A union of strings             | Check one state of each permutation of its values  |
| `@noDeadlock`          | The first statement            | Allow states where no action can run               |

A function that takes `before` reads the state before the step from it, and the variables themselves hold the state after the step.

Parameters of a temporal property hold for every value of their type. `@leadsTo` passes them to the target.

```ts
/** @always */
export const neverDecreases = (before: { count: number }) => count >= before.count;

/** @leadsTo isServed */
export const isWaiting = (proc: Proc) => waiting.has(proc);
```

## API

```ts
import { check } from "tla-ts";
import { compile } from "tsprover";

const spec = compile(source, "bank.proof.ts");
const result = await check(spec);
```

`compile(source, fileName?)` returns `{ source, config }`, the TLA+ spec and its config. Imports resolve relative to `fileName`. It throws `TsproverError` for type errors and for TypeScript that has no TLA+ equivalent.

## License

MIT

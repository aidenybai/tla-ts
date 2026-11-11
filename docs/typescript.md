# Check TypeScript

tla-ts checks a TypeScript file as it checks a TLA+ spec. It compiles the file to a TLA+ spec and config, writes them beside the file, and model checks every reachable state.

```ts
// bank.ts
type Account = "alice" | "bob";

let balances: Record<Account, number> = { alice: 10, bob: 10 };

export const transfer = (from: Account, to: Account, amount: 1 | 2 | 3) => {
  balances[from] -= amount;
  balances[to] += amount;
};

export const noOverdraft = () => balances.alice >= 0 && balances.bob >= 0;
```

```shell
npx tla-ts bank.ts
```

```
Error: Invariant noOverdraft is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
balances = [alice |-> 10, bob |-> 10]

State 2: <transfer("bob","alice",2) line 8, col 3 to line 8, col 80 of module Bank>
balances = [alice |-> 12, bob |-> 8]
…
State 5: <transfer("bob","alice",3) line 8, col 3 to line 8, col 80 of module Bank>
balances = [alice |-> 21, bob |-> -1]
```

Add `if (balances[from] < amount) return;` at the top of `transfer`, and all 21 reachable states pass.

## The files tla-ts writes

tla-ts names the module after the file, so `bank.ts` writes `Bank.tla` and `Bank.cfg` and `die-hard.ts` writes `DieHard.tla` and `DieHard.cfg`. Open them to read the spec, or check them with TLC.

Each file starts with a comment that names its TypeScript source. tla-ts overwrites a file with that comment, and stops with an error on any other file of that name. A hand-written `Bank.tla` stays as it is.

Pass TypeScript and TLA+ files in one command, as in `npx tla-ts bank.ts Spec.tla`. TLC's options, such as `-workers`, `-deadlock` and `-config`, apply to both.

## How TypeScript maps to TLA+

A file's top-level declarations become the spec:

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

TLC tries every value of a parameter's type, so a parameter needs a finite type:

| TypeScript type                | Values                                  |
| ------------------------------ | --------------------------------------- |
| `"a" \| "b"`, `1 \| 2`, enums  | Each literal                            |
| `boolean`, `null`, `undefined` | `true` and `false`, `null`, `undefined` |
| `{ x: 0 \| 1; y: boolean }`    | Every record of those fields            |
| `[0 \| 1, boolean]`            | Every tuple of those elements           |
| `Set<T>`                       | Every subset of `T`'s values            |
| `Map<K, V>`                    | Every partial function from `K` to `V`  |

`number`, `string`, and arrays have no end, so tla-ts rejects them as parameter types. A parameter of any type works when the action starts with a guard such as `if (!pending.has(message)) return;`. tla-ts then chooses the parameter from that set. A later guard's set may use a parameter an earlier guard chose, as in `if (!getMoves(from).has(to)) return;`.

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

`===` compares values, not references, so two sets with the same elements are equal, and a `Set` of arrays or objects keeps one copy of equal elements. Sets keep no order.

### Operations

- **Numbers**: `+`, `-`, `*`, `**`, `%`, comparisons, `Math.floor(a / b)`, `Math.trunc(a / b)`, `Math.min`, `Math.max`, and `Math.abs`. `%` keeps JavaScript's sign. Write division with `Math.floor` or `Math.trunc`.
- **Strings**: `+`, template literals, `length`, `===`, and `!==`. TLA+ strings have no order, so `<` and `>` don't take strings.
- **Arrays**: `at`, `includes`, `indexOf`, `slice`, `concat`, `with`, `toReversed`, `map`, `filter`, `every`, `some`, `find`, `findIndex`, spreads, `Array.from({ length: n }, (_, i) => …)`, and `Array(n).fill(v)`.
- **Sets**: `has`, `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, and `isDisjointFrom`. `[...s]` and `s.values()` take `every`, `some`, `filter`, `map`, and `find`. `find` on a set returns an arbitrary match that is the same on every call.
- **Maps and records**: `get`, `has`, `size`, `keys()`, `values()`, `entries()`, `Object.keys`, `Object.values`, `Object.entries`, and `new Map(s.values().map((k) => [k, v]))` or `Object.fromEntries(…)` to build one from a set.
- **Changes in actions**: assignments to variables and their fields, destructuring such as `[a, b] = [b, a]`, `++`, `--`, `+=`, `-=`, `*=`, `push`, `pop`, `shift`, `unshift`, `add`, `delete`, `set`, and `clear`. Changes reach through lookups, as in `held.get(proc)!.add(fork)`. `const head = queue.shift()!` reads the first element and removes it.
- **Control flow**: `if`, `else`, `switch`, `return`, `?:`, `const` and `let` locals, and local arrow functions. Use `map`, `filter`, `every`, `some`, or a parameter in place of loops.
- **Output**: `console.log` prints, and `console.assert(condition, message)` and `throw new Error(message)` stop the check with an error.

### Helpers and imports

A function you don't export becomes a TLA+ operator, and it may call itself. An action may call a helper that changes state, and tla-ts inlines that helper. Pass a helper by name where a callback goes, as in `procs.values().some(isWaiting)`.

Import types from anywhere, and constants and functions from other TypeScript files. tla-ts compiles what you import into the spec. A file can't import values from packages that ship only compiled JavaScript.

### Properties, fairness, and options

JSDoc tags cover what TypeScript has no syntax for:

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
| `@terminating`         | A boolean function             | Stopping where it holds isn't a deadlock           |
| `@noDeadlock`          | The first statement            | Allow states where no action can run               |

A function that takes `before` reads the state before the step from it, and the variables themselves hold the state after the step.

A spec with `@eventually`, `@alwaysEventually`, `@eventuallyAlways`, or `@leadsTo` makes every action weakly fair, for each parameter value, unless it tags some actions `@fair` or `@strongFair`. Then only those are fair. Tag only the fair actions when the others may never run, such as steps that something outside the system takes.

Parameters of a temporal property hold for every value of their type. `@leadsTo` passes them to the target.

```ts
/** @always */
export const neverDecreases = (before: { count: number }) => count >= before.count;

/** @leadsTo isServed */
export const isWaiting = (proc: Proc) => waiting.has(proc);
```

## Errors

tla-ts stops with a `TlaTypeScriptError` at the file, line, and column of the problem:

- **Type errors**: the file doesn't type check.
- **No TLA+ equivalent**: the file uses TypeScript that tla-ts can't compile, such as a loop, `/`, or `Math.random()`.
- **Existing file**: a `.tla` or `.cfg` file of the module's name exists, and tla-ts didn't write it.

```
TlaTypeScriptError: division.ts:4:11 Write division as Math.floor(a / b) or Math.trunc(a / b)
```

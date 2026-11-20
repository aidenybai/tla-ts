# Check TypeScript and JavaScript

tla-ts runs a TypeScript or JavaScript file as Node runs it and model checks every state the file reaches. It compiles the file to a TLA+ spec by specializing ESCore, a TLA+ port of the ECMAScript semantics of [engine262](https://github.com/engine262/engine262), and checks the spec in memory. It writes no files.

```shell
npx tla-ts bank.ts
```

## What runs

tla-ts runs a file as Node does:

- It strips the types and doesn't type check the file, so a file with type errors runs. It reads types only to build a model's frame, as [Models](#models) describes.
- It takes the file kinds that Node runs: `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, and `.cjs`. A `.tsx` or `.jsx` file stops, since tla-ts doesn't run JSX yet.
- It loads a file as an ES module or as CommonJS as Node does, by its extension, its `package.json`'s `type`, and its syntax.
- It loads the files that a script imports or requires, as Node resolves them.

A file that exports no function is a script. A file that exports a function is a model.

## Scripts

tla-ts runs a script's top level, then the jobs it queued, then its timers. The check passes where the script runs to its end, and fails where it leaves an exception or a rejected promise uncaught.

```ts
// total.ts
const total = [1, 2, 3].reduce((sum, item) => sum + item, 0);
if (total !== 7) throw `total is ${total}`;
```

The CLI exits with the code that Node exits with, and writes what Node writes to stderr:

```
file:///work/total.ts:2
if (total !== 7) throw `total is ${total}`;
                 ^
total is 6
(Use `node --trace-uncaught ...` to show where the exception was thrown)
```

It does so for a thrown primitive, for an unhandled rejection, and for a top-level `await` that never settles, where it exits with 13. An uncaught `Error` object stops the check with `tla-ts can't print what Node prints for this uncaught exception`, since V8 writes the error's stack.

## Models

A model is a file whose exported functions are the steps of a state machine:

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

```
Error: Invariant noOverdraft is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
balances = [alice |-> 10, bob |-> 10]

State 2: <transfer("bob","alice",2) line 558, col 31 to line 558, col 90 of module ProgramCode>
balances = [alice |-> 12, bob |-> 8]
…
State 5: <transfer("bob","alice",3) line 558, col 31 to line 558, col 90 of module ProgramCode>
balances = [alice |-> 21, bob |-> -1]
```

Add `if (balances[from] < amount) return;` at the top of `transfer`, and all 21 reachable states pass.

The module's top level runs once to make the initial state. Each step calls an exported function, then runs the jobs and timers that the call leaves. A state is the program's heap and bindings after a step. The lines and columns in a trace are in the compiled module `ProgramCode`, not in the file.

A model that imports other files stops the compile, since tla-ts can't check one yet.

### The model's frame

TypeScript's type checker gives the model's frame: which bindings are state, which values each parameter takes, and which function is an action or a check.

| TypeScript                                                                            | In the model                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A top-level `let` or `var`                                                            | A state variable                                        |
| A top-level `const` of a literal or a new collection that a function changes in place | A state variable                                        |
| `let bit: 0 \| 1;`, with no initializer                                               | A state variable that starts at every value of its type |
| An exported function that writes state or returns nothing                             | An action                                               |
| An exported function without parameters that returns a boolean                        | An invariant                                            |
| Any other exported function that returns                                              | A check that calls it with every argument               |
| A parameter, such as `(proc: Proc)`                                                   | Every value of its type                                 |

An exported function is a function declaration, or an exported `const` of an arrow function or a function expression. An async function or a generator isn't one.

A call that writes nothing that existed before it takes no step. An invariant fails where its call returns other than `true`. A check fails where its call throws. A check that reads no state is an assumption, which TLC checks once before the search, so a throw in it is an `assumption-violation`. A check that reads state is an invariant, so a throw in it fails the check where the state is reached.

The name of each state variable and exported function must be a TLA+ name, which TLA+'s keywords and the model's own names, such as `Init`, `Next`, and `vars`, aren't. Otherwise the compile stops with a `TlaTypeScriptError`.

### Values of a type

TLC tries every value of a parameter's type, so each type has a finite set of values:

| TypeScript type                | Values                                            |
| ------------------------------ | ------------------------------------------------- |
| `"a" \| "b"`, `1 \| 2`, enums  | Each literal                                      |
| `boolean`, `null`, `undefined` | `true` and `false`, `null`, `undefined`           |
| `{ x: 0 \| 1; y: boolean }`    | Every object of those properties                  |
| `[0 \| 1, boolean]`            | Every array of those elements                     |
| `Set<T>`                       | A `Set` of every subset of `T`'s values           |
| `Map<K, V>`                    | A `Map` of every partial function from `K` to `V` |
| `number`                       | The integers from -3 to 3                         |
| `string`                       | `""`, `"a"`, and `"b"`                            |
| `T[]`                          | Every array of `T`s up to 3 long                  |

The bounds on `number`, `string`, and arrays keep the search finite, so a check covers only those values. Use a union of literals, such as `0 | 1 | 2`, to check other values. A union of values that TLC can't compare, such as a string and a number, stops the compile.

Other types have no finite set of values: a function, a class's instances, an object with an optional property, a tuple with optional or rest elements, and a type that holds itself. tla-ts calls no exported function with a parameter of such a type, and prints a line naming it, such as `tla-ts calls no run: its parameter step takes values it can't list`. It also calls no exported function without parameters whose every call throws.

A parameter of any type works where the action starts with a guard such as `if (!pending.has(message)) return;`, and `pending` is a `Set`. The step then chooses the parameter from the set as it holds in the state. A later guard's set may use a parameter that an earlier guard chose, as in `if (!getMoves(from).has(to)) return;`.

### What a trace shows

A trace shows each state variable as a TLA+ value:

| JavaScript                  | TLA+                                           |
| --------------------------- | ---------------------------------------------- |
| Integers, strings, booleans | Integers, strings, `TRUE` and `FALSE`          |
| Other numbers               | The string that `String` gives                 |
| `null`, `undefined`         | `Null` and `Undefined`                         |
| Arrays                      | Sequences, with `Undefined` for a hole         |
| `Set`, `Map`                | Sets, and functions from keys to values        |
| A function                  | `[function \|-> name]`                         |
| Another object              | A record of its enumerable own data properties |

An accessor, a symbol, a BigInt, and an object that holds itself stop the check.

### Properties, fairness, and options

JSDoc tags cover what TypeScript has no syntax for:

| Tag                    | On                             | Meaning                                                                        |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `@fair`, `@strongFair` | An action                      | Weak or strong fairness, for each parameter value                              |
| `@initially`           | A boolean function             | Start only in states where it holds                                            |
| `@eventually`          | A boolean function             | It holds at some point                                                         |
| `@alwaysEventually`    | A boolean function             | It holds infinitely often                                                      |
| `@eventuallyAlways`    | A boolean function             | It holds forever from some point                                               |
| `@leadsTo other`       | A boolean function             | Whenever it holds, `other` holds later                                         |
| `@always`              | A boolean function of `before` | Every step satisfies it                                                        |
| `@constraint`          | A boolean function             | Don't explore past states that fail it                                         |
| `@actionConstraint`    | A boolean function of `before` | Don't take steps that fail it                                                  |
| `@view`                | A function                     | Count states as equal when it returns equal values                             |
| `@assume`              | A boolean function             | Check it once before the search, or in the initial states where it reads state |
| `@postcondition`       | A boolean function             | Check it after the search                                                      |
| `@terminating`         | A boolean function             | Stopping where it holds isn't a deadlock                                       |
| `@noDeadlock`          | The first statement            | Allow states where no action can run                                           |

A function that takes `before` reads the state before the step from it, an object of the state variables' values, and the variables themselves hold the state after the step. Parameters of a temporal property hold for every value of their type, and `@leadsTo` passes them to the target. A misspelled tag, such as `@fiar`, stops the compile. `@symmetric` stops it too, since tla-ts can't check a symmetric model yet.

```ts
/** @always */
export const neverDecreases = (before: { count: number }) => count >= before.count;

/** @leadsTo isServed */
export const isWaiting = (proc: Proc) => waiting.has(proc);
```

A model whose every action only counts a state variable up or down by one, and which checks nothing, stops the compile, since its states never end.

## Files with other specs

Pass TypeScript, JavaScript, and TLA+ files in one command, as in `npx tla-ts bank.ts Spec.tla`. TLC's options, such as `-workers` and `-deadlock`, apply to all of them. `-config` replaces the config that tla-ts compiles. A `Bank.tla` or `Bank.cfg` beside `bank.ts` stays as it is, and tla-ts doesn't read it.

## Errors and stops

tla-ts stops with a `TlaTypeScriptError` in two cases:

- Node rejects the file. tla-ts parses the file's JavaScript with V8, as Node does as it loads it, without running it, and the message is V8's `SyntaxError`, as in `TlaTypeScriptError: spec.js:2:1 SyntaxError: Delete of an unqualified identifier in strict mode.` Where no Node is at hand, TypeScript's checks of the file stand in for V8's.
- tla-ts can't run what the file does exactly. The message says what it can't do, as in `TlaTypeScriptError: spec.js:1:15 tla-ts can't run eval`. tla-ts never runs `eval` or `Function`.

A check also stops where a step reaches what tla-ts can't run exactly, with an `Assert` whose message starts with `tla-ts can't`.

ESCore's runtime starts its realm once a process. The package's build holds the realm prepared. From the sources, starting it takes a deeper stack than Node's default, as with `node --stack-size=4000`. Otherwise tla-ts throws a `TlaError` that says `tla-ts can't start ESCore's realm`.

`compile` runs in Node only, since ESCore's host runs on Node's `vm`. In a browser, it throws a `TlaTypeScriptError`.

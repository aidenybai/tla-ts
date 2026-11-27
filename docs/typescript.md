# Check TypeScript and JavaScript

tla-ts runs a TypeScript or JavaScript file as Node 26 runs it and model checks every state the file reaches. It compiles the file to a TLA+ spec by specializing JS.tla, a TLA+ port of the ECMAScript semantics of [engine262](https://github.com/engine262/engine262), and checks the spec in memory. JS.tla is the only compiler for TypeScript and JavaScript input.

```shell
npx tla-ts bank.ts
```

tla-ts writes no TLA+ spec or config for the file. Where a check fails, it writes TLC's trace spec beside the file, as TLC does, such as `Program_TTrace_1795166691.tla` and its `.bin`.

## What tla-ts runs

tla-ts runs a file as Node does:

- It strips the types as Node 26 strips them, and doesn't type check the file. A file with type errors runs.
- It rejects the TypeScript syntax that Node's type stripping rejects, with Node's message, as in `TlaTypeScriptError: enum.ts:1:1 TypeScript enum is not supported in strip-only mode`.
- It reads the types only to build a model's frame, as [The model's frame](#the-models-frame) describes.

The CLI takes `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`, `.tsx`, and `.jsx` files. tla-ts runs a `.tsx` or `.jsx` file as the JavaScript that TypeScript writes for it, by the options of its `tsconfig.json`, or with React's automatic runtime, which imports `react/jsx-runtime`, where no project holds the file. A project whose `jsx` option is `preserve` or `react-native` stops, since it leaves the JSX for another tool.

A file is a model where it puts `export` on a function declaration or on a variable whose value is a function, other than an async function or a generator. Any other file is a script.

### Node 26 as the reference

tla-ts models Node 26, which `.node-version` pins. The stack traces, the module loader, the type stripping, and the recorded time zones, calendars, and date formats come from Node 26.13.1. The package's build and the website record Node's realm, and recording on another major version throws a `TlaError` that says `tla-ts can't record the host on Node <version>; it needs Node 26`. The CLI and the API record the realm of the Node that runs them, so run them on Node 26. Under Bun, which reports Node's version as its own, they throw a `TlaError` that says `tla-ts can't record the host on Bun <version>`.

## Modules and file kinds

The entry file runs as an ES module in these cases:

- It's a `.mts` or `.mjs` file.
- Its `package.json` has `"type": "module"`. The CLI reads the `package.json` of a `.js` entry only where you pass the file's absolute path.
- It's a TypeScript file whose own syntax needs a module, such as `import`, `export`, or `await` at its top level.

Any other entry file runs as a script. A `.js` entry without that `type` that uses `import`, `export`, or `await` at its top level stops, though Node finds the syntax and runs it as a module. It stops with `tla-ts can't compile a module as a script`, or with V8's `SyntaxError` for the `await`.

tla-ts runs a script entry without the function that Node wraps CommonJS code in. `require`, `module`, `exports`, `__filename`, and `__dirname` aren't defined there, so a `.cjs` entry that calls `require` throws a `ReferenceError` where Node runs it.

A module entry, or a script that calls `import()`, loads the files it imports and requires:

- A `.ts`, `.mts`, or `.tsx` file loads as an ES module, and a `.cts` file as CommonJS.
- A JavaScript file loads as Node loads it: by its extension, its `package.json`'s `type`, and, for a `.js` file without a `type`, its syntax.
- A JSON file loads for an `import` with `with { type: "json" }` and for a `require`, and both get the same value.
- An ES module gets the names that Node's lexer finds a CommonJS module exports, and a `require` of an ES module gets its namespace, as Node gives them.

Each import and require loads the file that Node resolves it to: a `require` by `require`'s resolution, and an `import` by Node's ESM resolution, with a package's `exports` and `imports` and their conditions. Where Node finds no file, tla-ts loads none either, so `import { STEP } from "./step"` stops the compile with `tla-ts can't load the module ./step` where Node throws `ERR_MODULE_NOT_FOUND`, and a `require` that Node can't resolve stops where it runs. TypeScript reads the types of the file that it resolves a specifier to, with the nearest `tsconfig.json` that includes the file, and where that's another file than Node's, as for a `.js` specifier beside a `.ts` file of its name, the compile stops with `tla-ts can't read the types of a module that Node loads from another file than TypeScript reads`. Where no Node is at hand, as on the website, a specifier loads the file that TypeScript resolves it to only where it names that file by a relative path, and else stops. An ES module may import Node's `async_hooks`, by `node:async_hooks` or `async_hooks`: its `AsyncLocalStorage` and `AsyncResource`, and the module itself as the default. An import of another of its names, or of all of them, stops with `tla-ts can't import createHook of node:async_hooks, of which it models AsyncLocalStorage and AsyncResource`.

A built-in module, such as `node:fs`, stops the compile, as in `TlaTypeScriptError: /work/builtin.js:1:1 tla-ts can't load the module node:fs`.

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

Node.js v26.13.1
```

It does so for a thrown primitive and for a promise rejected with a primitive, where it exits with 1. Where a top-level `await` never settles, it writes Node's warning and exits with 13. A script that leaves a promise pending with no `await` on it ends, as in Node.

An uncaught `Error` object writes what Node writes, except the frames of its stack, and exits with 1. Where Node throws it from code whose location tla-ts can't tell, or where tla-ts can't tell the object's text, the check stops with `tla-ts can't print what Node prints for this uncaught exception`.

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

State 2: <transfer("bob","alice",2) line 462, col 31 to line 462, col 90 of module ProgramCode>
balances = [alice |-> 12, bob |-> 8]
…
State 5: <transfer("bob","alice",3) line 462, col 31 to line 462, col 90 of module ProgramCode>
balances = [alice |-> 21, bob |-> -1]
```

Add `if (balances[from] < amount) return;` at the top of `transfer`, and all 21 reachable states pass.

The module's top level runs once to make the initial state. Each step calls an exported function, then runs the jobs and timers that the call leaves. A state holds the module's bindings after a step. The lines and columns in a trace are in the compiled module `ProgramCode`, not in the file.

A model that imports another file stops the compile with `tla-ts can't compile a module as a script`, since tla-ts can't check one yet.

### The model's frame

TypeScript's type checker gives the model's frame: which bindings are state, which values each parameter takes, and which function is an action or a check. It reads the types with the options of the nearest `tsconfig.json` that includes the file, with `strict` on.

| TypeScript                                                                                               | In the model                                            |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A top-level `let` or `var`                                                                               | A state variable                                        |
| A top-level `const` of a literal, or of a new `Map`, `Set`, or `Array`, that a function changes in place | A state variable                                        |
| `let bit: 0 \| 1;`, with no initializer                                                                  | A state variable that starts at every value of its type |
| An exported function that writes state or returns nothing                                                | An action                                               |
| An exported function without parameters that returns a boolean                                           | An invariant                                            |
| Any other exported function that returns                                                                 | A check that calls it with every argument               |
| A parameter, such as `(proc: Proc)`                                                                      | Every value of its type                                 |

An exported function is a function declaration, or a variable whose value is an arrow function or a function expression. An async function or a generator isn't one.

A function without parameters whose return type is `any`, `unknown`, or a union of a boolean and other types may be either an invariant or a check. The two differ only where it returns `false`, so tla-ts checks it as a check that also stops there with `tla-ts can't tell whether name is an invariant`. Give it the return type `boolean` to check that it holds, or another type to check that it returns. A function that reads a package without type declarations often returns `any` this way.

A call that writes nothing that existed before it takes no step. TLC checks deadlocks as follows:

- **A model with an action**: TLC reports a deadlock at a state where no call of any action writes, unless the model allows it with `@noDeadlock` or `@terminating`. A model whose actions never write deadlocks in its initial state, since no step can run.
- **A model without an action**: TLC checks no deadlock, since the model takes no step, so every state would be a deadlock. This covers a model without state, and a model whose exported functions are all checks.

An invariant fails where its call returns other than `true`. An action or a check fails where its call throws, with the error's `message`, or the thrown value as a string. A check that reads no state is an assumption, which TLC checks once before the search, so a throw in it is an assumption violation. A check that reads state is an invariant, so a throw in it fails where the state is reached.

A model without state runs its top level as an assumption too, so a throw there is an assumption violation. In a model with state, a throw at the top level fails the initial state.

A collection that a helper changes in place through its parameter, as `add(line, lengths)` changes `lengths`, isn't a state variable. The check counts its value in the state, but a trace doesn't show it.

The name of each state variable and exported function must be a name that TLA+ doesn't reserve. TLA+'s keywords, such as `CHOOSE`, and the model's own names, such as `Init`, `Next`, and `vars`, aren't, so the compile stops: `tla-ts can't name the state variable vars in TLA+, which takes the name for its own`. A state variable whose name TLA+ can't spell, such as `$` or `_`, takes a name of its own in TLA+, and a trace shows it by its JavaScript name.

### Values of a type

TLC tries every value of a parameter's type, so each type needs a finite set of values:

| TypeScript type                | Values                                            |
| ------------------------------ | ------------------------------------------------- |
| `"a" \| "b"`, `1 \| 2`         | Each literal                                      |
| `boolean`, `null`, `undefined` | `true` and `false`, `null`, `undefined`           |
| `{ x: 0 \| 1; y: boolean }`    | Every object of those properties                  |
| `{ x?: 0 \| 1 }`               | `{}`, and every object of `x`'s values            |
| `[0 \| 1, boolean]`            | Every array of those elements                     |
| `Set<T>`                       | A `Set` of every subset of `T`'s values           |
| `Map<K, V>`                    | A `Map` of every partial function from `K` to `V` |
| `number`                       | The integers from -3 to 3                         |
| `bigint`                       | The BigInts from `-3n` to `3n`                    |
| `string`                       | `""`, `"a"`, and `"b"`                            |
| `T[]`                          | Every array of `T`s up to 3 long                  |
| `Iterable<T>`                  | Every array of `T`s up to 3 long                  |
| `[T, ...T[]]`                  | Every array of `T`s from 1 up to 3 long           |
| A type parameter `A`           | `0`, `1`, and `2`, or its constraint's values     |
| `(a: A, i: number) => B`       | Every table from `A`'s values to `B`'s            |

An object with an optional property is each object that lacks or holds it. A held property also takes `undefined`, unless the nearest `tsconfig.json` that includes the file sets `exactOptionalPropertyTypes`. A file that no project includes gets TypeScript's default, which leaves it off.

The bounds on `number`, `string`, and arrays keep the search finite, so a check covers only those values. Use a union of literals, such as `0 | 1 | 2`, to check other values.

A generic function's checks cover only part of each type it takes. Every type parameter without a constraint, or whose constraint is `unknown`, takes `0`, `1`, and `2`. A type parameter with a constraint takes the constraint's values, so `N extends number` takes the integers from -3 to 3. A callback is a function that looks up its first argument in a table and returns the value it finds there, or `undefined` for an argument the table lacks. It ignores its other arguments. A callback without parameters looks up `undefined`, and the line says `callbacks as tables of no argument`. A method of an object is a callback too, so an object takes every object of its methods' tables and its other properties' values, and the line says `methods as tables of their first argument` or `methods as tables of no argument`. The parameter takes every table from the first parameter's values to the result's values. A callback's first parameter must take primitives and can't be a rest parameter, and its type must have one call signature and no properties. Where a call takes any of these, tla-ts prints what it took, such as `tla-ts calls some with A := {0, 1, 2}; iterables as arrays up to length 3; callbacks as tables of their first argument`.

Each such argument list is a call on JS.tla, so a call that takes any of these makes at most 10,000 argument lists. Where its parameters make more, it takes smaller values instead: `0` and `1` for a type parameter and arrays up to 2 long, then `0` alone and arrays up to 1 long. Every array of the call takes the smaller bound, and the line lists it, such as `arrays up to length 2`. Where even the smallest values make more than 10,000 argument lists, tla-ts calls no such function and prints the count.

A type that the module declares, and that has no finite set of values of its own, takes the values that the module's constructors of it make. A constructor is an exported function of the module that returns the type and whose parameters take only primitives or a type parameter's values. The parameter takes each value that each constructor returns for each list of its arguments. An argument list whose call throws makes no value. This applies only to plain data that can't change. A plain data type's values hold at least one property that TLA+ can name, besides methods, and every such property holds plain data. Each required property must be read-only, and no type parameter of the type may be both `in` and `out`. A type argument must be a type parameter without a constraint. An effect, which holds no such property, and a mutable cell aren't plain data. The note of the call names the constructors, such as `Option<A> := none(), some(value), fromNullishOr(a), fromUndefinedOr(a), fromNullOr(a)` in the line for `Option.getOrElse`.

Other types have no finite set of values:

- A function with more than one call signature, or with properties, or an object with an index signature, such as `Record<string, number>`.
- A class's instances.
- An object with a property that TLA+ can't name, or with an optional property and a numeric key.
- A tuple with optional elements, or with a rest element whose type differs from another element's, or with more than 3 elements before its rest element.
- A type that holds itself.

tla-ts calls no exported function with a parameter of such a type, or of a union of values that TLC can't compare, such as a string and a number, and prints a line that names it and the kind of its type, such as `tla-ts calls no apply: its parameter transform is a function, whose values tla-ts can't list`. The kinds it names are `any` or `unknown`, a function that isn't a callback, an instance of a class, and an object with methods, alone or in a union. For a union of values that TLC can't compare, it names their kinds, as in `its parameter value is a union of string and number, whose values TLC can't compare`. For any other type, the line gives the reason, as in `its parameter p takes values it can't list: …`. It calls no exported function whose parameters make more argument lists, every combination of their values, than TLC puts in a set, 1,000,000 unless `-maxSetSize` sets it, and the line gives the count, as in `its parameters make 18,892,923 argument lists, more than the 1,000,000 it lists`. It also calls no exported function without parameters whose every call throws. Where it calls no exported function at all, the compile stops with `tla-ts compiles a script, not a model, to JS.tla this way`.

A state variable of such a type with no initializer starts at `undefined`, as Node starts it, and tla-ts prints a line that names it, such as `tla-ts starts count at undefined, as Node does: …`.

### Guards

A parameter of any type works where the action starts with a guard such as `if (!pending.has(message)) return;`, and `pending` is a `Set`. The step then chooses the parameter from the set as it holds in the state. A later guard's set may use a parameter that an earlier guard chose, as in `if (!getMoves(from).has(to)) return;`. Where the guard's value isn't a `Set` as the step runs, the check stops with `tla-ts can't choose a parameter from a value other than a Set`.

### What a trace shows

A trace shows each state variable as a TLA+ value:

| JavaScript                  | TLA+                                            |
| --------------------------- | ----------------------------------------------- |
| Integers, strings, booleans | Integers, strings, `TRUE` and `FALSE`           |
| Other numbers               | The string that `String` gives, such as `"0.5"` |
| `null`, `undefined`         | `Null` and `Undefined`                          |
| Arrays                      | Sequences                                       |
| `Set`, `Map`                | Sets, and functions from keys to values         |
| A function                  | `[function \|-> name]`                          |
| Another object              | A record of its enumerable own data properties  |

The check stops where the state holds a value that tla-ts can't keep or show, with a message that starts with `tla-ts can't keep` or `tla-ts can't show`. Such values include an accessor, a symbol, a BigInt, an object that holds itself, an array with holes, an object with a symbol key, and a built-in function such as `Math.max`.

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
| `@view`                | One function                   | Count states as equal when it returns equal values                             |
| `@assume`              | A boolean function             | Check it once before the search, or in the initial states where it reads state |
| `@postcondition`       | A boolean function             | Check it after the search                                                      |
| `@terminating`         | A boolean function             | Stopping where it holds isn't a deadlock                                       |
| `@noDeadlock`          | Any top-level statement        | Allow states where no action can run                                           |
| `@symmetric`           | A union of string literals     | Count states as equal when they differ by a permutation of its values          |

A function that takes `before` reads the state before the step from it, an object of the state variables' values. The variables themselves hold the state after the step. Parameters of a temporal property hold for every value of their type, and `@leadsTo` passes them to the target. A tag one typo away from a known tag stops the compile, as in `TlaTypeScriptError: before.ts:7:5 Unknown tag: @fiar`.

```ts
// steps.ts
/** @noDeadlock */
let count = 0;

/** @fair */
export const step = (by: 1 | 2) => {
  if (count < 4) count += by;
};

/** @always */
export const neverDecreases = (before: { count: number }) => count >= before.count;

/** @eventually */
export const isDone = () => count >= 4;
```

All 6 reachable states pass. Remove `@fair`, and `isDone` fails with a behavior that stutters at `count = 3`.

### Models whose states never end

A model stops the compile where its states never end:

- Its top level only declares types, functions, and variables of literal values.
- It checks nothing: no invariant, property, constraint, or other tag.
- Each statement of each action counts a state variable that starts at a whole number up or down.

A statement counts where it adds or subtracts a whole literal, or a parameter whose type is a union of whole literals of one sign, or does so in a `for…in` over an object literal with a key.

```ts
// counter.ts
let count = 0;

export const increment = () => {
  count += 1;
};
```

```
TlaTypeScriptError: counter.ts:3:3 tla-ts can't check a model whose states never end: an action counts count on at each step, and the model checks nothing that could stop it
```

A model whose actions count the same way but that checks an invariant or a property has states that never end too. tla-ts checks every state that 20 steps reach, so it reports an invariant that fails at a small count as the violation it is. Where none fails by then, the check stops, and never reports success:

```
Error: The first argument of Assert evaluated to FALSE; the second argument was:
"tla-ts can't check a model whose states never end: an action counts count on at each step, and the check stopped after every state within 20 steps"
```

TLC, given the same spec without the bound, reports the same violation, and where none fails, it explores states until it runs out of memory.

### Symmetric values

`@symmetric` on a type such as `type Client = "c1" | "c2" | "c3"` is your assertion, as TLC's `SYMMETRY` is. You assert that swapping the type's values maps each behavior to another behavior. tla-ts doesn't prove it. A program that tells the values apart gets an unsound verdict: the check can pass while a violation exists.

TLC checks the model under `SYMMETRY` over model values that stand for the strings. A `Set`, a `Map`, or an object whose keys are all values of the type loses its insertion order in the state.

tla-ts stops the compile where it can't rule out that the program tells the values apart, and it stops where it's unsure. The message starts with `tla-ts can't check a symmetric model`. It stops a program that:

- Puts `@symmetric` on something other than a type alias of a union of two or more names, such as `"c1"`, that aren't properties of `Object.prototype`, or gives two symmetric types a value in common.
- Names a value, as a string or as a property name, other than as a key of an object literal at the module's top level that gives each value of the type the same initializer: a literal, `[]`, `{}`, `new Set()`, or `new Map()`.
- Holds a value whose type is `string`, a template literal type, `any`, `unknown`, a type parameter, `keyof`, a conditional type, `Object`, or `{}`.
- Iterates, spreads, or destructures as an array, with `for…of`, `for…in`, `...`, `[a] =`, or `yield*`, or uses a template literal.
- Applies an operator other than `===`, `!==`, `&&`, `||`, `??`, `!`, `=`, or `,` to a value that may be a string.
- Reads a property of a value that may be a string, or indexes an array, a function, or a string by one.
- Calls a function other than one that the module declares, or a method other than `add`, `clear`, `delete`, `difference`, `get`, `has`, `includes`, `intersection`, `isDisjointFrom`, `isSubsetOf`, `isSupersetOf`, `pop`, `push`, `set`, `symmetricDifference`, or `union` of a `Set`, a `Map`, or an array, or constructs anything but a `Set` or a `Map`.
- Checks a temporal property, since a symmetry can hide its violation, as TLC warns: `tla-ts can't check a symmetric model's temporal properties`.
- Keeps its state on JS.tla's heap rather than as TLA+ values: `tla-ts can't check a symmetric model whose state JS.tla keeps on its heap yet`. A model does so in these cases: its top level does more than declare `let` and `const` bindings and functions, a binding's initializer reads one of its functions or a class, its code names `async`, `Promise`, `then`, or `setTimeout`, or it names an error or catches one.

The check stops too where a state holds an object, a `Set`, or a `Map` that mixes the type's values with other keys or elements. [`simple-allocator.ts`](../packages/tla-ts/tests/fixtures/typescript/simple-allocator/simple-allocator.ts) ports the safety part of `SimpleAllocator.tla`. It finds the same 50 distinct states and 226 generated states that TLC finds under the spec's `Symmetry`.

## Values that vary between runs

Node gives some values that differ from run to run. tla-ts stops where a program reads one, since no single run fixes it:

- **`Math.random`**: a call stops with `tla-ts can't run Math.random, whose value the host picks at random`.
- **`Date.now` and `new Date()`**: each gives an opaque time, which a program may store, pass, and return. The check stops where the program first reads its value, such as by comparing it, doing arithmetic on it, or formatting it: `tla-ts can't read the host's clock, whose time each run reads anew`. `Date()` called as a function and `Temporal.Now` stop the same way.
- **Local time**: where Node's time zone isn't UTC, a read of local time, such as `getHours`, stops with `tla-ts can't tell the host's local time, whose time zone isn't UTC`.
- **`WeakRef`**: `deref` gives the target in the job that made the `WeakRef`. In a later job, it stops with `tla-ts can't tell whether the host collected a WeakRef's target after the job that kept it`.
- **`FinalizationRegistry`**: `register` stops with `tla-ts can't tell when the host collects a registered target, which runs the registry's callback`.
- **`Atomics`**: the operations on shared memory run. A `waitAsync` that a `notify` wakes stops with `tla-ts can't tell when the host resolves a wait that a notify wakes, which it does in a task of its own`. A timeout of one stops where timers or the promise's reactions wait too: `tla-ts can't tell whether the host times out this wait, which it may leave as it exits`.

This script passes, since it keeps the times without reading them:

```ts
// now.ts
const start = Date.now();
const stamp = new Date();
const kept = [start, stamp];
if (kept.length !== 2) throw "lost";
```

## Errors that the engine throws

Where JS.tla throws an error itself, its `message` is V8's exact message where tla-ts knows it. These messages match Node 26:

- `missing is not defined`
- `Cannot access 'count' before initialization`
- `Assignment to constant variable.`
- `box.call is not a function`
- `Cannot read properties of null (reading 'x')`
- `Cannot assign to read only property 'size' of object '#<Object>'`
- `Cannot add property size, object is not extensible`
- `Reduce of empty array with no initial value`

For another error, such as the `RangeError` of `new Array(-1)`, a read of its `message` stops with `tla-ts can't read the message that Node writes for an error it throws`.

In an ES module, an error's `stack` reads as Node 26 writes it, with Node's own frames below the module's. In a script, a read of `stack` stops with `tla-ts can't tell the location Node gives this file`.

Where a program reaches a part of ECMAScript that JS.tla leaves out, the check stops with `tla-ts can't model` and JS.tla's reason, as in `tla-ts can't model a locale the host's table leaves out`. Where JS.tla gives no reason, the message is `tla-ts can't run a part of ECMAScript that JS.tla leaves out`.

## Intl and Temporal

JS.tla has no Intl, as engine262 has none. tla-ts records Node's answers as it compiles, for the inputs that the program writes:

- **Locale tags**: each string that may be a tag, with Node's canonical form of it and the services that support it.
- **Intl objects and methods**: the objects that the program's literals make, and the results of their methods for each argument that the literals, or arithmetic of literals, may give. `new Intl.NumberFormat("de-DE").format(1234 + 0.5)` runs. A value that the program computes otherwise stops with `tla-ts can't model a value the host's Intl table leaves out`.
- **Date strings**: `Date.parse` of a string that the program writes between quotes, in a format that ECMA-262 doesn't define, gives what Node's gives. Any other such string stops with `tla-ts can't tell whether the host reads this date string`.
- **Time zones**: a table of every time zone that Node 26.13.1 takes, with its transitions through 2037 and the rule of its later transitions where Node follows it. A zone that a string of the program names runs, as does each zone whose name starts with a string of the program that ends in `/`, `-`, or `+`. Any other zone name, such as one that `["Europe", "Paris"].join("/")` makes, stops with `tla-ts can't model a time zone that the host's table leaves out`.
- **Calendars**: tables of the Chinese and Dangi calendars, which Node computes astronomically, for the years 1800 to 2200 and the years that test262's tests name. Another year stops with `tla-ts can't tell the months of a Chinese or Dangi year that the host's table leaves out`.
- **Date formats**: Node's English patterns for a Temporal object's `toLocaleString` and an `Intl.DateTimeFormat`'s `format`, where Node's default locale is `en-US` and its time zone is UTC.

`toLocaleLowerCase` and `toLocaleUpperCase` stop at a language whose case mappings ICU tailors: Azerbaijani, Greek, Armenian, Lithuanian, and Turkish.

## Checks on the website

The website at [tla-ts.com](https://tla-ts.com) compiles and checks in the browser, which has no `node:vm`. It reads a realm that Node 26 recorded as the site was built, so a compile there differs from one in Node:

- It answers the locale tags that the realm recorded and stops at others: `en-US`, `en`, `en-GB`, `ar`, `de`, `de-DE`, `es`, `es-ES`, `fr`, `fr-FR`, `hi`, `it`, `ja`, `ja-JP`, `ko`, `nl`, `pt`, `pt-BR`, `ru`, `sv`, `tr`, `zh`, `zh-CN`, and `zh-TW`.
- It doesn't answer what Intl formats or how `Date.parse` reads a date string outside ECMA-262's formats, so those stop with a message that starts with `tla-ts can't`.
- It finds a file's early errors with TypeScript's checks, since it has no V8 to parse with.
- It runs a program on the files of the React package that the site was built with, at `/node_modules/react`, from `/`, in an empty environment. `process.env.NODE_ENV` is undefined, so React's development build runs, as in Node with no `NODE_ENV`.
- It finds a package by its `exports`, as Node does. A package without `exports`, or whose `exports` use patterns or arrays, stops with `tla-ts can't resolve`. A model that imports a module stops with `tla-ts can't read the types of`, since TypeScript reads only the model's own file.

The package's `compile` runs in Node only. Elsewhere, it throws `TlaTypeScriptError: tla-ts can't compile TypeScript outside Node yet`.

## Files with other specs

Pass TypeScript, JavaScript, and TLA+ files in one command, as in `npx tla-ts bank.ts HourClock.tla`. tla-ts prints `Checking bank.ts` before each file and exits with the first code that isn't 0. TLC's options, such as `-workers` and `-deadlock`, apply to all of them. The programs of the files share the TypeScript files that they parse, so one command over a package's files runs faster than a command for each.

`-frame`, another tla-ts extension, prints a model's [frame](#the-models-frame) before its check: the spec of its state variables, the functions it calls and the values it calls them with, then its config. It comes after the `tla-ts calls no` lines. A script prints none. Another tool can read the frame with `parseModule` to call the same functions in Node.

`-config` applies to one file. For a program, it replaces the config that tla-ts compiles and keeps the compiled `CONSTANT` lines. A `Bank.tla` or `Bank.cfg` beside `bank.ts` stays as it is, and tla-ts doesn't read it.

## Errors and stops

tla-ts stops with a `TlaTypeScriptError`, before the check, in these cases:

- Node rejects the file. In Node, tla-ts parses the file's JavaScript with V8 and runs none of it. It uses `vm.Script` for a script. It parses a program's modules in one Node process with `vm.SourceTextModule`, which compiles a module as Node's loader does, and parses a module that it rejects again with `node --input-type=module --check`, for the line of the error. The message is V8's `SyntaxError`, as in `TlaTypeScriptError: early.js:3:1 SyntaxError: Delete of an unqualified identifier in strict mode.` Elsewhere, such as in a browser, TypeScript's checks of the file stand in for V8's.
- Node's type stripping rejects the file, with Node's message.
- tla-ts can't run what the file does exactly. The message says what it can't do, as in `TlaTypeScriptError: evaluated.js:1:15 tla-ts can't run eval`.
- tla-ts can't build the model's frame, as [Models](#models) describes.

A message names the file and the line and column where it applies. V8's `SyntaxError` and a stop in the file's code name a `.ts` file by its JavaScript name, such as `evaluated.js`. Node's type stripping and a model's frame name the `.ts` file.

These stop the compile:

| Message                                                            | Where                                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `tla-ts can't run eval`                                            | A call of `eval`                                                                    |
| `tla-ts can't run the host's setInterval, which JS.tla leaves out` | A script that names a global that only Node has, such as `console` or `setInterval` |
| `tla-ts can't read the value of setTimeout`                        | A script that uses `setTimeout` other than as a call statement                      |
| `tla-ts can't load the module node:fs`                             | An import of a built-in module, or of a file that tla-ts can't find                 |
| `tla-ts can't compile a module as a script`                        | A model that imports another file                                                   |
| `tla-ts can't compile … to JS.tla yet`                             | Syntax that tla-ts doesn't compile yet                                              |

A check stops where it reaches what tla-ts can't run exactly. It fails TLC's `Assert` with a message that starts with `tla-ts can't`, and exits with TLC's code for an evaluation error. These stop the check:

| Message                                                                                  | Where                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `tla-ts can't print what Node prints for this uncaught exception`                        | A script leaves an `Error` object uncaught                          |
| `tla-ts can't read the message that Node writes for an error it throws`                  | A read of the message of an error whose message tla-ts doesn't know |
| `tla-ts can't write an object to the host's console, which formats it`                   | A module writes an object with `console.log`                        |
| `tla-ts can't run CreateDynamicFunction, which this program's spec leaves out of JS.tla` | A call of `Function`                                                |
| `tla-ts can't model …`, `tla-ts can't run a part of ECMAScript that JS.tla leaves out`   | A part of ECMAScript that JS.tla leaves out                         |
| `tla-ts can't keep …`, `tla-ts can't show …`                                             | A model's state holds a value that tla-ts can't hold                |
| The messages in [Values that vary between runs](#values-that-vary-between-runs)          | A value that differs from run to run                                |

The CLI checks on a thread with an 8&nbsp;MB stack. A program whose check needs a deeper stack stops with a `TlaStackLimitError`, though Node runs it:

```ts
// deep.ts
const depth = (n: number): number => (n === 0 ? 0 : 1 + depth(n - 1));
if (depth(1000) !== 1000) throw new Error("wrong depth");
```

```
TlaStackLimitError: tla-ts can't check this program within the stack: its check overflowed its 8 MB stack at depth 0
```

The thread's heap is the one Node gives the process, which `--max-old-space-size` sets. A program whose check runs out of it stops with a `TlaHeapLimitError`, with the same exit code, such as `TlaHeapLimitError: tla-ts can't check this program within Node's default heap of 4192 MB`.

JS.tla's realm starts once a process. The package's build holds the realm prepared for the host that built it. On a host whose realm differs, such as one with another time zone or locale, tla-ts starts the realm itself.

Starting the realm takes a deeper stack than Node's main thread has, and the CLI's thread has it. Where you call `compile` on Node's main thread, run Node with a deeper stack, as with `node --stack-size=4000`. Otherwise tla-ts throws a `TlaError`: `tla-ts can't start JS.tla's realm, whose evaluation ran out of stack: run Node with a deeper stack, as with --stack-size=4000`.

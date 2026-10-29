# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

tla-ts is a drop-in replacement for [TLC](https://github.com/tlaplus/tlaplus) that's **2× faster**.

TLA+ lets you write formal models of a system, and TLC model checks them. But TLC is written in Java and needs the JVM. tla-ts runs anywhere JavaScript runs, such as the browser, Node, and Bun. Try it in the [playground](https://tla-ts.aidenybai.com).

```ts
import { check } from "tla-ts";

const result = await check({
  source: `---- MODULE Counter ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Small == x < 3
====`,
  config: "INIT Init NEXT Next INVARIANT Small",
});

result.status; // "invariant-violation"
```

## Install

```shell
npm install tla-ts
```

## Command line

The `tla-ts` command takes TLC's options and prints TLC's output. `tla-ts prove` takes tlapm's options and prints tlapm's output.

### Check a spec

To check a spec, pass its path:

```shell
npx tla-ts Spec.tla
```

tla-ts reads the configuration from `Spec.cfg` next to the spec. It exits with the exit code TLC uses for the same result.

You can pass several paths, or a glob such as `"specs/*.tla"`. tla-ts checks each spec in turn and exits with the exit code of the first spec that fails. A glob skips each module that has no `.cfg` next to it, so it doesn't check helper modules that other specs import. tla-ts never skips a path that you pass by name. If you pass a `.cfg` path, tla-ts checks the `.tla` file with the same name.

The options are:

- `-config <Spec.cfg>`: read the configuration from this file. You can use it only when you check one spec.
- `-deadlock`: don't report deadlocks.
- `-lncheck final`: check liveness once, after the search ends.
- `-seed <num>`: seed `RandomElement` and the `Randomization` module. The default is 0.
- `-workers <count|auto>`: search with this number of worker threads. `auto` uses one thread per core. The default is 1.

TLC can replace a module's operators with Java methods, and tla-ts reads the same files. If the spec's directory has `Module.class`, tla-ts replaces each operator in `Module` with the public static method that has the same name and arity.

### Generate proof obligations

A proof obligation is one claim that a backend prover must prove. `tla-ts prove -N` prints the obligations of a module, as `tlapm -N` does. It doesn't run a prover. For example, this command prints every obligation in `Module.tla` with its text:

```shell
npx tla-ts prove -N --toolbox 0 0 --printallobs Module.tla
```

With `--toolbox` or `--line`, tla-ts writes the messages of the TLA+ Toolbox protocol to stderr, as tlapm does. If you pass a tlapm option that isn't in this list, tla-ts prints an error:

- `--toolbox <start> <end>`: print Toolbox messages for the proofs from line `start` to line `end`. `0 0` selects the whole module.
- `--line <num>`: print Toolbox messages for the proof at this line.
- `--printallobs`: print the text of each obligation.
- `--summary`: print the number of obligations in each module, and list its missing and omitted proofs. You don't need `-N` with `--summary`.
- `--strict`: report missing proofs, omitted proofs and a selected range with no obligations as errors.
- `-I <directory>`: search this directory for modules.

tla-ts searches for modules in the same order as tlapm:

1. The directory of each module you pass, the last one first.
2. The current directory.
3. The standard library of tlapm, which has the `TLAPS` module. tla-ts searches it only if `tlapm` is on your `PATH`.
4. The `-I` directories, the last one first.

### Prove with tlapm

Without `-N`, `--summary` or `--backend`, `tla-ts prove` runs [tlapm](https://github.com/tlaplus/tlapm) from your `PATH`:

```shell
npx tla-ts prove Module.tla
```

tla-ts expands the globs and passes every argument to tlapm, so all of tlapm's options work. tlapm sends the obligations to its provers, and tla-ts exits with the exit code of tlapm. If `tlapm` isn't on your `PATH`, tla-ts prints an error and exits with code 1.

### Prove with a backend

`tla-ts prove --backend` proves each module with [`prove`](#prove) and prints each obligation's status as it finishes:

```shell
npx tla-ts prove --backend tla-ts Module.tla
```

- `--backend <tla-ts|tlapm>`: prove with tla-ts's own provers, or with tlapm from your `PATH`.
- `-I <directory>`: search this directory for modules.

tla-ts exits with code 1 if an obligation fails or isn't supported.

## API reference

### `check`

Checks a spec against a TLC configuration and resolves to the result.

```ts
import { check } from "tla-ts";

const result = await check({
  source: specSource,
  config: configSource,
  loadModule: (name) => modules[name],
  onPrint: (text) => console.log(text),
});
```

| Option                  | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `source`                | The TLA+ module to check                                                                 |
| `config`                | A TLC configuration, as text or as the result of `parseConfig`                           |
| `loadModule`            | Returns the source of a module that isn't a standard module                              |
| `loadClass`             | Returns a compiled Java class that overrides a module's operators with constants         |
| `onPrint`               | Receives the output of `Print` and `PrintT`. Defaults to `console.log`                   |
| `onPause`               | Runs when `TLCSet("pause", TRUE)` pauses checking, which resumes when it returns         |
| `readFile`, `writeFile` | Read and write files for the Json module                                                 |
| `seed`                  | A `bigint` seed. Defaults to `0n`, and matches TLC run with the same `-seed` and `-fp 0` |
| `workers`               | The number of worker threads. Defaults to 1                                              |

The result has these fields:

- `status`: `"success"`, `"deadlock"`, `"assumption-violation"`, `"invariant-violation"`, `"property-violation"`, `"liveness-violation"`, `"postcondition-violation"`, or `"error"`.
- `violation`: the `name` of what failed and the `trace` that reaches it. `loopStart` marks where a liveness counterexample loops back.
- `failure`: the message and trace when `status` is `"error"`.
- `generatedStates`, `distinctStates`, and `depth`: TLC's state counts.

Workers run in Node, Bun, Deno, and cross-origin isolated pages in the browser. Like TLC's workers, they share one table of 64-bit fingerprints. `check` runs on the calling thread in these cases:

- `SharedArrayBuffer` is unavailable, as on a page without cross-origin isolation.
- The spec has liveness properties.
- The spec uses impure operators such as `Print`.
- The configuration has `VIEW`, `POSTCONDITION`, or `_POSSIBLE`.

After a violation or an error, `check` reruns on the calling thread to return TLC's exact trace.

`check` supports:

- **Modules**: the standard modules, TLCExt, Json, and Randomization, plus `EXTENDS`, `INSTANCE`, and `LAMBDA`.
- **Configuration**: `CONSTANTS`, `INIT`, `NEXT`, `SPECIFICATION`, invariants, properties, constraints, `SYMMETRY`, `VIEW`, `ALIAS`, `POSTCONDITION`, `CHECK_DEADLOCK`, and `_POSSIBLE`.
- **Properties**: invariants and every temporal formula TLC accepts, checked through TLC's tableau construction.
- **TLC semantics**: 32-bit integer overflow, `TLCGet` and `TLCSet`, subexpression references such as `Op!2`, and TLC's enumeration order for `CHOOSE` and quantifiers.

### `prove`

Proves the obligations of a TLAPS proof and resolves to their statuses.

```ts
import { prove } from "tla-ts";

const result = await prove({
  source: moduleSource,
  loadModule: (name) => modules[name],
  onObligation: (obligation) => console.log(obligation.location, obligation.status),
});
```

| Option         | Description                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| `source`       | The TLA+ module to prove                                                                  |
| `loadModule`   | Returns the source of a module it extends or instantiates                                 |
| `backend`      | `"tla-ts"` proves with tla-ts's own provers. `"tlapm"` runs tlapm. Defaults to `"tla-ts"` |
| `signal`       | An `AbortSignal` that stops proving                                                       |
| `onObligation` | Receives each obligation as soon as its status is known                                   |

The `"tla-ts"` backend tries each obligation in tlapm's default order. It checks whether the obligation is trivial, then sends it to an SMT solver with the same SMT-LIB encoding as tlapm. `SMTT(n)` gives the solver `n` seconds, and the default is 5 s. A step proved with `Zenon`, `PTL` or another prover is `"unsupported"` for now. The `"tlapm"` backend runs `tlapm --toolbox 0 0` from your `PATH`, so it works only in Node and Bun. It throws `TlaUnsupportedError` in a browser or when tlapm is missing.

The result has these fields:

- `obligations`: each obligation's `id`, `location`, `text`, and `status`. The status is `"proved"`, `"trivial"`, `"failed"`, or `"unsupported"`. An obligation that wasn't proved has a `reason`.
- `summary`: the number of obligations with each status, and the numbers of missing and omitted proofs, as `tlapm --summary` counts them.

### `parseModule`

Parses a TLA+ module into its syntax tree. Throws `TlaSyntaxError` on invalid input.

```ts
import { parseModule } from "tla-ts";

const module = parseModule(specSource);
module.name; // "Counter"
```

### `parseConfig`

Parses a TLC configuration file into a `ModelConfig`. Pass the result to `check` to change it before checking.

```ts
import { check, parseConfig } from "tla-ts";

const config = parseConfig(configSource);
config.checkDeadlock = false;
await check({ source: specSource, config });
```

### `formatValue`

Prints a value in TLA+ syntax, as TLC prints it in traces.

```ts
import { formatValue } from "tla-ts";

result.violation?.trace.forEach((step) => {
  Object.entries(step.state).forEach(([name, value]) => console.log(name, formatValue(value)));
});
```

### Errors

Every error extends `TlaError`:

- `TlaSyntaxError`: the module does not parse
- `TlaConfigError`: the configuration is invalid or refers to an unknown name
- `TlaEvaluationError`: evaluation failed, as when TLC reports an error
- `TlaUnsupportedError`: the spec uses a feature tla-ts does not support yet

## Benchmarks

Wall time on one worker, including JVM and Node startup. Both checkers report the same state counts on every model.

| Spec                                                           | Distinct states |     TLC |  tla-ts | Speedup |
| -------------------------------------------------------------- | --------------: | ------: | ------: | ------: |
| [Two-phase commit](packages/tla-ts/benchmarks/commit)          |         282,251 |  4.32 s |  2.01 s |    2.2× |
| [Dining philosophers](packages/tla-ts/benchmarks/philosophers) |         128,889 |  1.06 s |  0.71 s |    1.5× |
| [Bounded queue](packages/tla-ts/benchmarks/queue)              |          44,044 |  0.37 s |  0.17 s |    2.2× |
| 542 conformance models                                         |                 | 986.6 s | 403.3 s |    2.4× |

Wall time on 8 workers, also including startup. Each time is the median of 3 runs on an Apple M4 Pro.

| Spec                                                                                                                  | Distinct states |     TLC | tla-ts | Speedup |
| --------------------------------------------------------------------------------------------------------------------- | --------------: | ------: | -----: | ------: |
| [Raft with reconfiguration](https://github.com/will62794/tla-web/blob/8193eb0/specs/RaftWithReconfigSingleServer.tla) |         298,493 | 10.50 s | 8.96 s |    1.2× |
| [Sailfish](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/dag-consensus)                             |         109,604 |  4.34 s | 4.07 s |    1.1× |
| [Fast Paxos](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/SimplifiedFastPaxos)                     |          25,617 |  3.91 s | 2.57 s |    1.5× |
| [Buffered random access file](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/braf)                   |           3,316 |  4.70 s | 3.61 s |    1.3× |

## Development

```shell
pnpm install
pnpm test
pnpm dev
```

`pnpm dev` starts the playground in `packages/website`.

Run the conformance suite against TLC's recorded results:

```shell
pnpm --filter tla-ts conformance:fetch
pnpm --filter tla-ts conformance
```

Rerun the benchmarks with `TLA2TOOLS_JAR` set to the path of `tla2tools.jar`:

```shell
pnpm --filter tla-ts bench
pnpm --filter tla-ts bench:corpus
```

## License

MIT

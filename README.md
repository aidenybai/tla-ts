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

### Check a spec

```shell
npx tla-ts Spec.tla
```

tla-ts reads `Spec.cfg`, takes TLC's options and exits with TLC's exit codes. You can pass several specs or a glob.

- `-config <Spec.cfg>`: read the configuration from this file.
- `-deadlock`: don't report deadlocks.
- `-dump [dot[,colorize][,actionlabels][,snapshot]] <file>`: write every reachable state, or the state graph with `dot`.
- `-lncheck final`: check liveness once, after the search ends.
- `-seed <num>`: seed `RandomElement` and the `Randomization` module. The default is 0.
- `-workers <count|auto>`: the number of worker threads. The default is 1.

### Generate proof obligations

```shell
npx tla-ts prove -N --toolbox 0 0 --printallobs Module.tla
```

`tla-ts prove -N` prints a module's proof obligations, as `tlapm -N` does.

- `--toolbox <start> <end>`: print Toolbox messages for the proofs in these lines. `0 0` selects the whole module.
- `--line <num>`: print Toolbox messages for the proof at this line.
- `--printallobs`: print the text of each obligation.
- `--summary`: print the number of obligations, and list missing and omitted proofs.
- `--strict`: report missing and omitted proofs as errors.
- `-I <directory>`: search this directory for modules.

### Prove

```shell
npx tla-ts prove --backend tla-ts Module.tla
```

`tla-ts prove --backend` proves each module with [`prove`](#prove) and prints each obligation's status.

- `--backend <tla-ts|tlapm>`: prove with tla-ts's own provers, or with tlapm from your `PATH`.
- `-I <directory>`: search this directory for modules.
- `-workers <count|auto>`: the number of worker threads. The default is 1.

Without `-N`, `--summary` or `--backend`, `tla-ts prove` runs [tlapm](https://github.com/tlaplus/tlapm) with your arguments.

## API reference

### `check`

Checks a spec against a TLC configuration.

```ts
import { check } from "tla-ts";

const result = await check({
  source: specSource,
  config: configSource,
  loadModule: (name) => modules[name],
});
```

| Option                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `source`                | The TLA+ module to check                                          |
| `config`                | A TLC configuration, as text or as the result of `parseConfig`    |
| `loadModule`            | Returns the source of a module that isn't a standard module       |
| `loadClass`             | Returns a compiled Java class that overrides a module's operators |
| `onPrint`               | Receives the output of `Print` and `PrintT`                       |
| `onPause`               | Runs when `TLCSet("pause", TRUE)` pauses checking                 |
| `readFile`, `writeFile` | Read and write files for the Json module and `dump`               |
| `seed`                  | A `bigint` seed. Defaults to `0n`                                 |
| `workers`               | The number of worker threads. Defaults to 1                       |
| `dump`                  | Writes the reachable states or the state graph                    |

The result has these fields:

- `status`: `"success"`, `"deadlock"`, `"assumption-violation"`, `"invariant-violation"`, `"property-violation"`, `"liveness-violation"`, `"postcondition-violation"`, or `"error"`.
- `violation`: the `name` of what failed and the `trace` that reaches it.
- `failure`: the message and trace when `status` is `"error"`.
- `generatedStates`, `distinctStates`, and `depth`: TLC's state counts.

### `prove`

Proves the obligations of a TLAPS proof.

```ts
import { prove } from "tla-ts";

const result = await prove({
  source: moduleSource,
  loadModule: (name) => modules[name],
  onObligation: (obligation) => console.log(obligation.location, obligation.status),
});
```

| Option         | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| `source`       | The TLA+ module to prove                                                  |
| `loadModule`   | Returns the source of a module it extends or instantiates                 |
| `backend`      | `"tla-ts"` for tla-ts's own provers, or `"tlapm"`. Defaults to `"tla-ts"` |
| `signal`       | An `AbortSignal` that stops proving                                       |
| `onObligation` | Receives each obligation as soon as its status is known                   |
| `workers`      | The number of worker threads. Defaults to 1                               |

The result has these fields:

- `obligations`: each obligation's `id`, `location`, `text`, and `status`: `"proved"`, `"trivial"`, `"failed"`, or `"unsupported"`.
- `missingProofCount` and `omittedProofCount`: the numbers of missing and omitted proofs.

### `parseModule`

Parses a TLA+ module into its syntax tree.

```ts
import { parseModule } from "tla-ts";

const module = parseModule(specSource);
module.name; // "Counter"
```

### `parseConfig`

Parses a TLC configuration file.

```ts
import { check, parseConfig } from "tla-ts";

const config = parseConfig(configSource);
config.checkDeadlock = false;
await check({ source: specSource, config });
```

### `formatValue`

Prints a value in TLA+ syntax.

```ts
import { formatValue } from "tla-ts";

formatValue(value); // "<<1, 2>>"
```

### Errors

Every error extends `TlaError`:

- `TlaSyntaxError`: the module doesn't parse.
- `TlaConfigError`: the configuration is invalid.
- `TlaEvaluationError`: evaluation failed.
- `TlaUnsupportedError`: the spec uses a feature tla-ts doesn't support yet.

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

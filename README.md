# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

A TLA+ model checker in TypeScript, **2× faster than TLC**.

tla-ts checks TLA+ specs with the same verdicts, error traces, and state counts as TLC. It runs in Node and in the browser without a JVM. Try it in the [playground](https://tla-ts.aidenybai.com).

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

## Usage

```shell
npx tla-ts Spec.tla [-config Spec.cfg] [-deadlock] [-lncheck final] [-seed 0] [-workers auto]
```

Pass several specs, a `.cfg` path or a glob such as `"specs/*.tla"` to check each spec in turn. A glob skips modules without a `.cfg` next to them, so helper modules aren't checked on their own. The exit code is the first failure's.

- `-config`: the TLC configuration. Defaults to `Spec.cfg` next to the spec. It applies to one spec only.
- `-deadlock`: turns off deadlock checking.
- `-lncheck final`: checks liveness once, after the search.
- `-seed`: seeds `RandomElement` and the Randomization module. Defaults to 0.
- `-workers`: the number of worker threads, or `auto` for one per core. Defaults to 1.

Output and exit codes match TLC's. The CLI loads a compiled Java class such as `Module.class` from the spec's directory as an override for that module.

### Proof obligations

```shell
npx tla-ts prove -N --toolbox 0 0 --printallobs Module.tla
```

`tla-ts prove -N` takes tlapm's options and prints the proof obligations tlapm prints, without running a prover. With `--toolbox`, it writes the Toolbox protocol messages to stderr, as `tlapm -N` does. It supports these options:

- `-N`: don't run a prover.
- `--toolbox <start> <end>`: print Toolbox messages for the proofs between those lines. `0 0` selects the whole module.
- `--line <num>`: print Toolbox messages for the proof at that line.
- `--printallobs`: include each obligation's text.
- `--summary`: print how many obligations each module has, and its missing and omitted proofs. It implies `-N`.
- `--strict`: report missing and omitted proofs, and a selected range with no obligations, as errors.
- `-I <directory>`: search a directory for modules.

Like tlapm, it searches for modules in the current directory and each module's directory first. If `tlapm` is on your `PATH`, it then searches tlapm's standard library, which has the `TLAPS` module. Last come the `-I` directories.

Without `-N` or `--summary`, `tla-ts prove` runs [tlapm](https://github.com/tlaplus/tlapm) from your `PATH` with the same options. tlapm then sends the obligations to its provers:

```shell
npx tla-ts prove Module.tla
```

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

Workers run in Node, Bun, Deno, and the browser, and deduplicate states by 64-bit fingerprint as TLC does. `check` runs on the calling thread for specs with liveness properties or impure operators such as `Print`. After a violation, it reruns there to return the exact trace.

`check` supports:

- **Modules**: the standard modules, TLCExt, Json, and Randomization, plus `EXTENDS`, `INSTANCE`, and `LAMBDA`.
- **Configuration**: `CONSTANTS`, `INIT`, `NEXT`, `SPECIFICATION`, invariants, properties, constraints, `SYMMETRY`, `VIEW`, `ALIAS`, `POSTCONDITION`, `CHECK_DEADLOCK`, and `_POSSIBLE`.
- **Properties**: invariants and every temporal formula TLC accepts, checked through TLC's tableau construction.
- **TLC semantics**: 32-bit integer overflow, `TLCGet` and `TLCSet`, subexpression references such as `Op!2`, and TLC's enumeration order for `CHOOSE` and quantifiers.

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

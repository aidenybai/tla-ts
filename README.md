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

```shell
npx tla-ts Spec.tla          # check a spec with TLC's options
npx tla-ts bank.ts           # compile TypeScript to TLA+ and check it
npx tla-ts tlapm Module.tla  # tlapm's command line, with tla-ts's provers
```

## Check TypeScript

tla-ts compiles a TypeScript file to a TLA+ spec and config, writes them beside the file, and checks them. Variables become state, exported functions that change state become actions, and exported functions that return a boolean become invariants.

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

`npx tla-ts bank.ts` writes `Bank.tla` and `Bank.cfg`, and reports that `noOverdraft` is violated after four transfers from `bob`. [Check TypeScript](https://github.com/aidenybai/tla-ts/blob/main/docs/typescript.md) lists every construct tla-ts compiles.

## API

### `check`

```ts
const result = await check({ source, config });
result.status; // "success", "deadlock", "invariant-violation", ...
result.violation?.trace;
```

| Option       | Description                                 |
| ------------ | ------------------------------------------- |
| `source`     | The TLA+ module                             |
| `config`     | A TLC configuration                         |
| `loadModule` | Returns the source of an imported module    |
| `workers`    | The number of worker threads. Defaults to 1 |

### `prove`

```ts
const result = await prove({ source });
result.obligations; // each with a status: "proved", "trivial", "failed", or "unsupported"
```

| Option         | Description                                      |
| -------------- | ------------------------------------------------ |
| `source`       | The TLA+ module                                  |
| `loadModule`   | Returns the source of an imported module         |
| `onObligation` | Receives each obligation as soon as it's decided |
| `workers`      | The number of worker threads. Defaults to 1      |

### `parseModule`

```ts
const module = parseModule(source);
module.name; // "Spec"
module.definitions;
```

### `parseConfig`

```ts
const config = parseConfig(configSource);
config.invariants.push("TypeOK");
await check({ source, config });
```

### `formatValue`

```ts
const step = result.violation.trace[0];
formatValue(step.state.queue); // "<<1, 2>>"
```

### Errors

| Error                 | Thrown when                                     |
| --------------------- | ----------------------------------------------- |
| `TlaError`            | Any of the errors below                         |
| `TlaSyntaxError`      | The module doesn't parse                        |
| `TlaConfigError`      | The configuration is invalid                    |
| `TlaEvaluationError`  | Evaluating the spec fails                       |
| `TlaUnsupportedError` | The spec or call uses something tla-ts can't do |

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

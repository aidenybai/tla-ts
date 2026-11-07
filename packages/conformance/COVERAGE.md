# What the suite covers

This page lists, for each oracle, how much the suite reaches, what it leaves out on purpose and the bugs it pins. The TLC figures are for TLC 1.8.0 at revision 309e489. The tlapm figures are for tlapm at revision b91fb6c, with Z3 5.3.2.

## TLC coverage

A run of the suite with the JaCoCo agent attached to TLC reaches:

| Measure                                            | Reached                  |
| -------------------------------------------------- | ------------------------ |
| Lines in TLC's checker and SANY                    | 65.8% (32,285 of 49,041) |
| Branches in TLC's checker and SANY                 | 61.2% (16,385 of 26,788) |
| Message codes in `tlc2.output.EC`                  | 138 of 236               |
| Command line flags parsed by `tlc2.TLC`            | 43 of 46                 |
| Public standard modules shipped in `tla2tools.jar` | 12 of 12                 |

The line and branch figures cover the `tlc2`, `tla2sany` and `util` packages. They leave out packages that a run of `tlc2.TLC` on one machine can't reach or doesn't exercise through specs:

- the debugger (`tlc2.debug`)
- distributed checking (`tlc2.tool.distributed`)
- SANY's XML exporter, API and drivers (`tla2sany.xml`, `tla2sany.api`, `tla2sany.drivers`)
- the fingerprint sets (`tlc2.tool.fp`), whose implementation a JVM property selects

These figures come from a run of every hand-written and imported test with a sample of a tenth of the generated tests. The generated tests mostly repeat code that other tests reach. Over the imported, CLI, config and error tests alone, a sample of each matrix added at most 0.5% of lines.

To measure coverage yourself, run TLC with `-javaagent:jacocoagent.jar=destfile=tlc.exec,append=true` through `--host`, then build a report from `tlc.exec` with `jacococli.jar report`.

## What the TLC tests leave out

A test must give the same transcript on every run and every machine. TLC behavior that cannot meet that rule is left out, grouped below by reason.

### Output that changes between runs

The runner drops these message codes before it compares transcripts, so no test pins their text:

- 2185, 2186, 2187, 2188, 2189, 2271: start, finish and mode banners
- 2200: progress reports, which TLC prints on a timer
- 2219, 2220: SANY start and end
- 2262, 2401: the TLC version and the JVM's garbage collector

Every test still prints them. Their absence from the table above only means no test compares them.

### Behavior that depends on the clock, the machine or the JVM

- `JavaTime`, `TLCGet("duration")` and `TLCGet("config").install`
- The values of `TLCGet("revision")`. Only its field names are tested.
- Progress, checkpoint and coverage reports that TLC prints on a timer
- Out of memory and stack overflow paths. Two `infinite_*_recursion` tests do pin a stack overflow, so they depend on the JVM's default stack size.
- Runs with more than one worker, which change state order and the trace TLC prints
- Checkpoints and `-recover`, which need an earlier run killed partway through
- Codes that only appear after a run of more than five minutes, such as 2777

### Behavior that needs more than a spec, a config and flags

- JVM properties: `DebugTableauDiskGraph`, `AddAndCheckLiveCheck`, Liveness's debug and tableau export, the extended simulation statistics and the fingerprint set choice
- Java module overrides, which need a compiled class on the classpath (2168, 2400, 2402, 2403)
- CommunityModules. The oracle runs without `CommunityModules.jar`, so `_DotTrace`, `_TLCTracePlain`, `_TLAPlusCounterExample`, `_TLCActionTrace` and `_TLCTESpec` pin only their parse error.
- Interactive input. `PickSuccessor`'s prompt and its failure at the end of input are tested, but not its answers.
- The `-debug` and `-debugger` flags, which wait for a debugger to attach
- `CheckImplFile` and its `CHECK_*` codes (3000 to 3114), which `tlc2.TLC` never runs
- Distributed checking (7000 and the `TLCServer` trace files)

### Code no input can reach

These codes were probed with specs written for them, or traced in TLC's source:

- 2284 is commented out where it would be raised.
- 2249 and 2251 sit behind `classifyExpr`, which rejects those formulas first.
- 2141 and 2142 sit behind the selector check, which fails first.
- 2234 sits behind a config check that reports 2225 first. 2238 is caught inside TLC, which reports 2139 instead.
- 2128 (`TLC_BUG`) and the internal codes 2164 and 2165 fire only when an invariant inside TLC breaks.
- 2282 and 2163 are reached, but TLC exits 1 with no transcript to compare, so no outcome fits.
- The pool, disk and fingerprint set errors (2125 to 2127, 2160, 2161, 2166, 2174, 2175, 2254, 2270) need disk or memory faults.

No spec was found for 2235, 2241 and 2243 either, but nobody has proved them unreachable.

## TLC bugs the suite pins

The suite records what TLC does, including where TLC is wrong. Each test that pins a TLC bug has `features: [tlc-bug]` and a description that names the cause. A host that matches TLC's real semantics fails these tests and lists them in its baseline.

Every bug below was confirmed against TLC's source. The cited lines are relative to `tlatools/org.lamport.tlatools/src`, and the test paths are relative to `test/tlc`.

### Model checking

| Bug                                                                                   | Cause                                                                                                                                     | Tests                                                                                                               |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `-continue` prints each violation, then "No error has been found", and exits 0        | `tlc2/tool/ModelChecker.java:524` never records the error. TLC's own `DoInitFunctorInvariantContinueTest` marks the exit status as wrong. | `checker/continue/*`, `checker/dfid/*_continue`, `checker/simulate/continue_*`, `cli/other/continue_flag`           |
| Under `-continue`, a deadlock overwrites an earlier error, so TLC exits 11            | `tlc2/tool/Worker.java:117`                                                                                                               | `checker/continue/next_error_then_deadlock`, `checker/continue/assert_then_deadlock`                                |
| Under `-continue`, a liveness violation that looks like a safety violation exits 255  | `tlc2/tool/liveness/LiveCheck.java:860` throws an exception no caller catches                                                             | `temporal/counterexample/safety_like_continue`                                                                      |
| Warning 2143 for `x' = 42 /\ UNCHANGED x` never prints                                | `tlc2/tool/impl/Tool.java:1006` takes a fast path when warnings are on, though its comment says it is for when they are off               | `checker/unchanged/after_different_value_warns`, `errors/TLC_UNCHANGED_VARIABLE_CHANGED/next_state_path_is_silent`  |
| `ENABLED (UNCHANGED op(t))` fails                                                     | `Tool.java:3591` calls this path buggy                                                                                                    | `checker/enabled/unchanged_operator_with_argument_bug`                                                              |
| Under `-dfid`, an evaluation error in an invariant on an initial state exits 0        | `tlc2/tool/DFIDModelChecker.java:103` never sets the result                                                                               | `checker/dfid/invariant_error_initial`                                                                              |
| `_POSSIBLE` under `-dfid` throws a null pointer exception                             | `tlc2/module/TLCExt.java:474` reads a worker DFID never creates                                                                           | `checker/possible/in_dfid`                                                                                          |
| `-simulate` never checks implied inits                                                | `tlc2/tool/Simulator.java` has no `getImpliedInits` call                                                                                  | `temporal/modes/simulate_implied_init_violated`                                                                     |
| `TLCGet("config").aril` is always `"0"` under `-simulate`                             | `Simulator.java:153` builds the record before it reads the seed                                                                           | `checker/simulate/get_config_seed_aril`                                                                             |
| A trace of one state skips the ALIAS                                                  | `tlc2/tool/TLCTrace.java:356`                                                                                                             | `checker/errors/error_with_alias_print`                                                                             |
| A constant POSTCONDITION exits 255 in model checking but 151 in simulation            | `Tool.java:3684` calls `getPostConditionSpecs` outside its `try`                                                                          | `checker/postcondition/constant_rejected`                                                                           |
| A stack overflow hangs `-simulate` forever                                            | `tlc2/tool/SimulationWorker.java:474` catches only `Exception`                                                                            | none, because the run never ends                                                                                    |
| The printed lasso drops a stutter step, so TLC can't name the violated property       | `tlc2/tool/liveness/LiveWorker.java:962`                                                                                                  | `temporal/counterexample/attribution_dropped_stutter_unnamed`                                                       |
| A temporal definition that reduces to a constant is rebuilt as an action and rejected | `tlc2/tool/liveness/Liveness.java:265`                                                                                                    | `temporal/formula/recursive_temporal_with_conj`, `temporal/formula/operator_constant_false_branch_of_temporal_body` |
| An operator parameter used as a box action throws a `ClassCastException`              | `Tool.java:368`                                                                                                                           | `temporal/spec_shape/op_param_is_box_action`                                                                        |

### Config files

| Bug                                                                             | Cause                                                   | Tests                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `SYMMETRY Sym` with `Sym == {}` throws an `IllegalArgumentException`            | `tlc2/value/impl/MVPerms.java:20`                       | `config/symmetry/empty_set`                    |
| A constant CONSTRAINT such as `I == 3` throws a `ClassCastException`            | `tlc2/tool/impl/SymbolNodeValueLookupProvider.java:105` | `config/non_boolean/constraint_constant`       |
| An integer past 32 bits in a `.cfg` assignment throws a `NumberFormatException` | `tlc2/tool/impl/ModelConfig.java:535`                   | `generated/config_values/assignment/too_big/*` |

### Expressions and standard modules

| Bug                                                                               | Cause                                                                                                                      | Tests                                                                                                                       |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| With `EXTENDS Naturals`, `-1 \div 2` is 0, not the floor -1                       | `tlc2/module/Naturals.java:176` decrements only when the truncated quotient is negative. `Integers.java` floors correctly. | `expressions/arithmetic/division/naturals_div_small_negative_is_zero`, `standard/naturals/div_truncated_to_zero_negative_*` |
| With `EXTENDS Naturals`, `-2147483648 \div -1` wraps                              | `Naturals.java:167` has no overflow check                                                                                  | `standard/naturals/div_min_by_minus_one_wraps`                                                                              |
| A tuple binder rejects a function equal to a tuple                                | `tlc2/tool/impl/ContextEnumerator.java`                                                                                    | `expressions/quantifier/tuple_binder_rejects_*`, `expressions/sets/map/tuple_binder_rejects_function_value`                 |
| A tuple binder in a filter has no length check                                    | `Tool.java:2483`                                                                                                           | `expressions/sets/filter/tuple_binder_reducible_*`                                                                          |
| A lazy function of several arguments ignores extra arguments                      | `tlc2/value/impl/FcnLambdaValue.java:212`                                                                                  | `expressions/functions/multi_argument/lazy_*`                                                                               |
| An operator argument whose body is a literal is rejected as "not an operator"     | `tlc2/tool/impl/SpecProcessor.java:2060`                                                                                   | `standard/bags/bag_of_all_literal_body`, `standard/sequences/selectseq_literal_body`, `standard/tlc/sort_literal_body`      |
| `BagIn`, `CopiesIn` and `BagCup` throw a null pointer exception on a non-function | `tlc2/module/Bags.java:121`                                                                                                | `standard/bags/*_non_function`                                                                                              |
| `BagDiff` wraps on int subtraction and drops the key                              | `Bags.java:241`                                                                                                            | `standard/bags/diff_int_wrap_drops_key`                                                                                     |
| `TLCSet("s:...")` drops the value during constant folding                         | `tlc2/module/TLCGetSet.java:537`                                                                                           | `standard/tlc_ext/get_or_default_named_set_folded`, `standard/internal/possible_track_constant_folded`                      |
| `PickSuccessor` throws a null pointer exception at state level and in Next        | `TLCExt.java:106`                                                                                                          | `standard/tlc_ext/pick_*`                                                                                                   |
| `RandomSubset` with a negative k throws a raw `NegativeArraySizeException`        | `tlc2/module/Randomization.java:43`                                                                                        | `standard/randomization/subset_negative_k`                                                                                  |

### Parsing and modules

| Bug                                                                                  | Cause                                                                                                     | Tests                                                                                                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RECURSIVE checks the arity of only the last parameter                                | `tla2sany/semantic/Generator.java:2617`                                                                   | `expressions/operators/recursive/operator_parameter_last_param_plain`, `modules/recursive/definition_operator_param_last_only` |
| INSTANCE of a nested module in LET or a proof step reports "Multiply-defined module" | `tla2sany/modanalyzer/SpecObj.java:528`                                                                   | `modules/instance/let_instance_of_nested_module`, `syntax/proofs/step_instance_of_nested_module`                               |
| A theorem or assumption reached through INSTANCE loses its substitution              | `SpecProcessor.java:1950` never visits its body                                                           | `modules/instance/*_loses_substitution`                                                                                        |
| `WITH Op <- \cup` or `\land` throws a null pointer exception                         | `SymbolNodeValueLookupProvider.java:262`                                                                  | `modules/instance/operator_constant_with_builtin_null_pointer`, `temporal/refinement/substitution_of_action_operator_builtin`  |
| Nonfix `\X(A, B)` and `\times(A, B)` throw a null pointer exception                  | `tla2sany/semantic/BuiltInOperators.java:105` declares `\times`, but TLC implements only `$CartesianProd` | `syntax/operators/nonfix_*_is_tlc_null_pointer`                                                                                |
| A nested module in a RECURSIVE section crashes                                       | `Generator.java:2241`                                                                                     | `modules/recursive/section_nested_module_with_definition_crash`                                                                |
| A THEOREM keyword as the first record field breaks the next definition               | `tla2sany/parser/TLAplusParser.java:2123`                                                                 | `syntax/fields/keyword_field_blocks_next_definition_*`                                                                         |
| The empty tuple pattern `<<>>` creates a parameter named `>>`                        | `Generator.java:2744`                                                                                     | `syntax/tuples/pattern_empty`                                                                                                  |
| Message 2112 shows a literal `%1`                                                    | `tlc2/output/MP.java:1103` writes `%1` where `replaceString` expects `%1%`                                | `checker/init/exists_tuple_pattern_mismatch`, `syntax/tuples/pattern_empty`                                                    |

Some TLC messages misname their operator. The suite pins them as ordinary tests, because the behavior is right:

- `SetToBag` says `BagToSet`.
- `SortSeq` says "natural number".
- `RandomSubset` says "a a finite set".
- `RandomSubsetSet` says `RandomSubsetSetProbability`.
- `IOUtils` `Serialize` says `ndJsonSerialize`.

## tlapm coverage

The tlapm half has 2,754 tests under `test/tlapm`:

| Directory     | Tests | Contents                                                                                                                                                   |
| ------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imported`    | 542   | tlapm's own harness, soundness, SANY and parser corpus tests, and the tests of Zenon and Isabelle in tlapm's checkout, ported by `scripts/import-tlapm.ts` |
| `obligations` | 372   | The obligations tlapm generates for each proof construct, and which facts PTL may box                                                                      |
| `backends`    | 1,357 | Inputs fed to each backend directly: 1,155 for Z3, of which 1,042 are z3test's regressions, 91 for Zenon, 55 for Isabelle and 56 for LS4                   |
| `encodings`   | 235   | The input tlapm writes for Z3, Zenon, Isabelle and LS4                                                                                                     |
| `proofs`      | 166   | Proof methods, command line flags, Isabelle tactics, statuses, `ENABLED` and the proof library                                                             |
| `errors`      | 80    | Parse, name, step, level, arity and `--line` selection errors                                                                                              |
| `smoke`       | 2     | One proof and one parse error                                                                                                                              |

tlapm isn't built with coverage instrumentation, so the suite has no line or branch figure for it. The tests instead cover each proof construct in `src/proof`, each backend that tlapm's release ships, and each exit status of `--strict`.

## What the tlapm tests leave out

A tlapm test must not depend on time, so no test may pass or fail because a backend reaches its time limit. The tlapm half also leaves out:

- **Backends the release doesn't ship**: CVC4, Yices, veriT, Zipperposition and Spass, and so `AllProvers` and `AllSMT`.
- **`BY Z3` and Yices encodings**: tlapm writes these inputs as `.smt2` and `.ys` files, which the harness doesn't capture yet.
- **Goals that only time out**: Z3 on `2^3 = 8` and on `ChooseExt`, Isabelle's `auto` on a `CASE`, LS4 on `[](p \/ q) => []p \/ []q`, and the library module `GeneralNatInduction`.
- **Z3 giving up**: on a false goal, the axioms `SetExt`, `CupDef` and `CastInjAlt` make Z3's model based quantifier instantiation run until the time limit. No test found a Z3 `unknown` that isn't a timeout.
- **Level errors**: tlapm doesn't check levels, and it leaves arity to SANY. Tests of `c'`, `ENABLED x''` and wrong arity record that tlapm accepts them.
- **`RECURSIVE`**: TLAPS doesn't support it, so the suite pins only its rejection.
- **The library module `BagsTheorems`**: it doesn't load, because tlapm can't find `Range`.
- **8 of tlapm's own tests**: 4 run tlapm twice, pipe its output through a shell or name a file that doesn't exist. 2 don't reproduce here: `smt_rlimit_bad_test` exits 10, not 3, and `INSTANCE_shift_due_to_omitted_modunits_test` fails an obligation. `GFX_test` and `SnapShot_test` run longer than the importer's limit of 120 seconds.
- **11 of Zenon's 54 tests**: 5 run longer than 120 seconds. 4 come from Focal and use definitions that need Zenon's Focal and induction extensions, which tlapm's command line doesn't load. Zenon proves `test03` and `test15`, but writes proofs of over 1 MB, 33 MB for `test03`. The 23 Focal tests in `.coz` files are left out, since tlapm never gives Zenon Focal input.
- **19 of Zenon's 47 regression tests**: they date from 2008. tlapm rejects 9, for example because they cite an operator the module doesn't define, such as `Inv1`, or use syntax tlapm no longer parses. With only Zenon, 2 fail an obligation and 5 are incomplete. 1 gives different results on two runs, and `AtomicBakeryG` and `AtomicBakeryGInitialized` run longer than 120 seconds.
- **Isabelle's `AtomicBakeryG.thy`**: it takes longer than 120 seconds to check.
- **292 of z3test's 1,334 SMT-LIB regressions**: Z3 5.3.2 prints other output than z3test expects for 283. Those in `old-regressions` were written for an older Z3's output, and `bounded_q` and `mcsat_smt2` test features newer than 5.3.2. 7 run longer than 60 seconds, z3test's own limit, or differ between runs, and 2 set a time limit. z3test's C++, C# and Python tests use Z3's API, and its other SMT-LIB files are benchmarks with no expected output, so the suite leaves both out.
- **LS4**: it has no tests of its own.

The runner removes what differs between machines from a transcript: the OCaml backtrace and the configuration tlapm prints when it crashes, the `PATH` it prints for a missing backend, and the command line that ran Zenon, which tlapm copies into each Isabelle theory.

## tlapm bugs the suite pins

Each test that pins a tlapm bug has `features: [tlapm-bug]`. Test paths are relative to `test/tlapm`, and the cited source is relative to tlapm's repository.

| Bug                                                                                                             | Cause                                                                                                                     | Tests                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BY AutoBlast` fails even on a tautology                                                                        | `library/TLAPS.tla` writes the tactic `auto, blast` without parentheses, and `src/backend/isabelle.ml#thy_temp` copies it | `proofs/isabelle/auto_blast`, `backends/isabelle/tactics/auto_then_blast.thy`                                              |
| Z3 rejects the axiom for a function of two arguments as ill sorted                                              | `src/encode/n_rewrite.ml#elim_multiarg` binds the wrong terms                                                             | `encodings/smt/functions/multiple_arguments`, `backends/z3/functions/fcn_two_args.smt`                                     |
| A set map over two bound variables, `{F(a, b) : a \in S, b \in T}`, crashes the SMT backend                     | `List.combine` in `src/encode/n_flatten.ml`, line 444, so tlapm hands Z3 an empty file                                    | `backends/z3/sets/setof_two_bounds.smt`                                                                                    |
| Under `--debug smarter_types`, `\A a, b \in Int` leaves `b` without a cast                                      | `src/type/t_synth.ml#expr`, line 347                                                                                      | `encodings/smt/arithmetic/smarter_types_shared_bound`                                                                      |
| Under `--debug rwsetext`, `\subseteq` stops with "Encode.Rewrite: internal error"                               | `src/encode/n_rewrite.ml`, line 738                                                                                       | `encodings/smt/sets/rewrite_subseteq`                                                                                      |
| "x is not a definition" doesn't fail the run, so `--strict` exits 0                                             | `src/proof/p_anon.ml#usable` reports it with `Errors.err`                                                                 | `obligations/by/by_def_*_reported`, `errors/use_hide/hide_def_of_constant`                                                 |
| A module level suppress pragma is ignored                                                                       | `src/module/m_gen.ml#generate`                                                                                            | `obligations/use_hide/module_use_suppressed`                                                                               |
| After an error in `HAVE` or `TAKE`, the `QED` goal is garbled                                                   | The error branches of `src/proof/p_simplify.ml#simplify_step` add a fact to the context without shifting the goal         | `obligations/have/have_not_implication`, `obligations/take/take_{unbounded_on_bounded,bounded_on_unbounded,not_universal}` |
| The `LOCAL` definitions of an extended module stay in scope                                                     | `src/module/m_flatten.ml#exports`                                                                                         | `obligations/definitions/local_definition_extended`                                                                        |
| A module instantiated only inside a proof step is never loaded, so tlapm crashes                                | `src/module/m_dep.ml#external_deps`                                                                                       | `obligations/instances/step_instance_not_loaded`                                                                           |
| `USE` of a named axiom in a `Now` scope gives it the time `Now`, so PTL can't box it                            | `src/proof/p_gen.ml#gen_step`                                                                                             | `obligations/time/use_fact_name_keeps_time`                                                                                |
| Applying a variable to an argument, `x(1)`, fails an assertion instead of reporting an error                    | `src/expr/e_anon.ml`, line 224                                                                                            | `errors/arity_level/variable_applied`                                                                                      |
| Without `-s`, `ptl_to_trp` prints `False` inside a clause as an atom, so LS4 finds `sometime False` satisfiable | `translate/fofunctions.ml#string_of_formula`. tlapm itself writes `FALSE` as `(cc & ~ cc)`, so a proof never reaches this | `backends/ls4/syntax/sometime_false.ls4`                                                                                   |

The 14 soundness tests under `imported/soundness_tests` with `tlapm-bug` are false theorems that tlapm still proves. tlapm's own tests list them with a `known:` line.

The Isabelle theory that tlapm writes declares `\div` as a fresh constant, `isa_bksl_diva`, so Isabelle can't prove anything about `\div`. `backends/isabelle/arithmetic/numeral_div.thy` pins this. It may be deliberate, so the test isn't tagged as a bug.

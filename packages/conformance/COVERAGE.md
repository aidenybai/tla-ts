# What the suite covers

This page lists how much of TLC the suite reaches, what it leaves out on purpose and the TLC bugs it pins. All figures are for the oracle, TLC 1.8.0 at revision 309e489.

## Coverage

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

## What the suite leaves out

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

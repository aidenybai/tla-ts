(*---
description: A filter over Nat has isFinite's own failure.
ref: tlc2/value/impl/SetPredValue.java#isFinite
features:
  - Randomization
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subset_filter_over_nat ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(1, {x \in Nat : x > 0}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module subset_filter_over_nat failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if expression of form {x \in S : p(x)} is a finite set, but cannot check if S:
    Nat
    is finite.
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if expression of form {x \in S : p(x)} is a finite set, but cannot check if S:
    Nat
    is finite.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_filter_over_nat
    1. Line 14, column 29 to line 14, column 32 in subset_filter_over_nat
    2. Line 12, column 9 to line 12, column 49 in subset_filter_over_nat
    3. Line 12, column 9 to line 12, column 44 in subset_filter_over_nat
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if expression of form {x \in S : p(x)} is a finite set, but cannot check if S:
    Nat
    is finite.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in subset_filter_over_nat
    1. Line 15, column 30 to line 15, column 33 in subset_filter_over_nat
    2. Line 12, column 9 to line 12, column 49 in subset_filter_over_nat
    3. Line 12, column 9 to line 12, column 44 in subset_filter_over_nat
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if expression of form {x \in S : p(x)} is a finite set, but cannot check if S:
    Nat
    is finite.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_filter_over_nat
    1. Line 16, column 8 to line 16, column 32 in subset_filter_over_nat
    2. Line 16, column 29 to line 16, column 32 in subset_filter_over_nat
    3. Line 12, column 9 to line 12, column 49 in subset_filter_over_nat
    4. Line 12, column 9 to line 12, column 44 in subset_filter_over_nat
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if expression of form {x \in S : p(x)} is a finite set, but cannot check if S:
    Nat
    is finite.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in subset_filter_over_nat
    1. Line 15, column 12 to line 15, column 36 in subset_filter_over_nat
    2. Line 15, column 33 to line 15, column 36 in subset_filter_over_nat
    3. Line 12, column 9 to line 12, column 49 in subset_filter_over_nat
    4. Line 12, column 9 to line 12, column 44 in subset_filter_over_nat
---*)

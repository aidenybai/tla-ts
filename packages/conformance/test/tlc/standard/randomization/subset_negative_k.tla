(*---
description: "A negative k has no check, despite the first-argument message saying nonnegative. Real TLC bug: the failure is an internal one."
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subset_negative_k ----
EXTENDS Randomization, FiniteSets, Integers
Test == RandomSubset(-1, {1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module subset_negative_k failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    -1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in subset_negative_k
    1. Line 15, column 29 to line 15, column 32 in subset_negative_k
    2. Line 13, column 9 to line 13, column 34 in subset_negative_k
    3. Line 13, column 9 to line 13, column 29 in subset_negative_k
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
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in subset_negative_k
    1. Line 16, column 30 to line 16, column 33 in subset_negative_k
    2. Line 13, column 9 to line 13, column 34 in subset_negative_k
    3. Line 13, column 9 to line 13, column 29 in subset_negative_k
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in subset_negative_k
    1. Line 17, column 8 to line 17, column 32 in subset_negative_k
    2. Line 17, column 29 to line 17, column 32 in subset_negative_k
    3. Line 13, column 9 to line 13, column 34 in subset_negative_k
    4. Line 13, column 9 to line 13, column 29 in subset_negative_k
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Randomization.RandomSubset(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in subset_negative_k
    1. Line 16, column 12 to line 16, column 36 in subset_negative_k
    2. Line 16, column 33 to line 16, column 36 in subset_negative_k
    3. Line 13, column 9 to line 13, column 34 in subset_negative_k
    4. Line 13, column 9 to line 13, column 29 in subset_negative_k
---*)

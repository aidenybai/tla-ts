(*---
description: "A linear search on a mixed domain fails on the first incomparable key it reaches."
ref: "tlc2/value/impl/FcnRcdValue.java#selectLinearSearch"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE double_at_mixed_miss ----
EXTENDS Integers, TLC
Test == ((1 :> 2) @@ ("a" :> 3))["a"] = 3
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module double_at_mixed_miss failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in double_at_mixed_miss
    1. Line 11, column 29 to line 11, column 32 in double_at_mixed_miss
    2. Line 9, column 9 to line 9, column 41 in double_at_mixed_miss
    3. Line 9, column 9 to line 9, column 37 in double_at_mixed_miss
    4. Line 9, column 10 to line 9, column 31 in double_at_mixed_miss
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in double_at_mixed_miss
    1. Line 12, column 30 to line 12, column 33 in double_at_mixed_miss
    2. Line 9, column 9 to line 9, column 41 in double_at_mixed_miss
    3. Line 9, column 9 to line 9, column 37 in double_at_mixed_miss
    4. Line 9, column 10 to line 9, column 31 in double_at_mixed_miss
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in double_at_mixed_miss
    1. Line 13, column 8 to line 13, column 32 in double_at_mixed_miss
    2. Line 13, column 29 to line 13, column 32 in double_at_mixed_miss
    3. Line 9, column 9 to line 9, column 41 in double_at_mixed_miss
    4. Line 9, column 9 to line 9, column 37 in double_at_mixed_miss
    5. Line 9, column 10 to line 9, column 31 in double_at_mixed_miss
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in double_at_mixed_miss
    1. Line 12, column 12 to line 12, column 36 in double_at_mixed_miss
    2. Line 12, column 33 to line 12, column 36 in double_at_mixed_miss
    3. Line 9, column 9 to line 9, column 41 in double_at_mixed_miss
    4. Line 9, column 9 to line 9, column 37 in double_at_mixed_miss
    5. Line 9, column 10 to line 9, column 31 in double_at_mixed_miss
---*)

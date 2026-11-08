(*---
description: A set of STRING and a number cannot be normalized.
ref: tlc2/value/impl/UserValue.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE set_mixed_with_int ----
EXTENDS TLC, FiniteSets
Test == Cardinality({STRING, 1}) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module set_mixed_with_int failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    STRING
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_mixed_with_int
    1. Line 14, column 29 to line 14, column 32 in set_mixed_with_int
    2. Line 12, column 9 to line 12, column 36 in set_mixed_with_int
    3. Line 12, column 9 to line 12, column 32 in set_mixed_with_int
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    STRING
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in set_mixed_with_int
    1. Line 15, column 30 to line 15, column 33 in set_mixed_with_int
    2. Line 12, column 9 to line 12, column 36 in set_mixed_with_int
    3. Line 12, column 9 to line 12, column 32 in set_mixed_with_int
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_mixed_with_int
    1. Line 16, column 8 to line 16, column 32 in set_mixed_with_int
    2. Line 16, column 29 to line 16, column 32 in set_mixed_with_int
    3. Line 12, column 9 to line 12, column 36 in set_mixed_with_int
    4. Line 12, column 9 to line 12, column 32 in set_mixed_with_int
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_mixed_with_int
    1. Line 15, column 12 to line 15, column 36 in set_mixed_with_int
    2. Line 15, column 33 to line 15, column 36 in set_mixed_with_int
    3. Line 12, column 9 to line 12, column 36 in set_mixed_with_int
    4. Line 12, column 9 to line 12, column 32 in set_mixed_with_int
---*)

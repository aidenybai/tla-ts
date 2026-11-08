(*---
description: "A model value does not make other mixed elements comparable."
ref: "tlc2/value/impl/ValueVec.java#sort"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT mv = mv
---*)
---- MODULE three_way_model_value_does_not_bridge ----
EXTENDS Integers, FiniteSets
CONSTANT mv
Test == Cardinality({1, mv, "a"}) = 3
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module three_way_model_value_does_not_bridge failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in three_way_model_value_does_not_bridge
    1. Line 14, column 29 to line 14, column 32 in three_way_model_value_does_not_bridge
    2. Line 12, column 9 to line 12, column 37 in three_way_model_value_does_not_bridge
    3. Line 12, column 9 to line 12, column 33 in three_way_model_value_does_not_bridge
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
    Attempted to compare string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in three_way_model_value_does_not_bridge
    1. Line 15, column 30 to line 15, column 33 in three_way_model_value_does_not_bridge
    2. Line 12, column 9 to line 12, column 37 in three_way_model_value_does_not_bridge
    3. Line 12, column 9 to line 12, column 33 in three_way_model_value_does_not_bridge
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in three_way_model_value_does_not_bridge
    1. Line 16, column 8 to line 16, column 32 in three_way_model_value_does_not_bridge
    2. Line 16, column 29 to line 16, column 32 in three_way_model_value_does_not_bridge
    3. Line 12, column 9 to line 12, column 37 in three_way_model_value_does_not_bridge
    4. Line 12, column 9 to line 12, column 33 in three_way_model_value_does_not_bridge
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in three_way_model_value_does_not_bridge
    1. Line 15, column 12 to line 15, column 36 in three_way_model_value_does_not_bridge
    2. Line 15, column 33 to line 15, column 36 in three_way_model_value_does_not_bridge
    3. Line 12, column 9 to line 12, column 37 in three_way_model_value_does_not_bridge
    4. Line 12, column 9 to line 12, column 33 in three_way_model_value_does_not_bridge
---*)

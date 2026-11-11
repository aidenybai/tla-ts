(*---
description: "A typed model value cannot be sorted with an integer."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT t_1 = t_1
---*)
---- MODULE typed_model_value_against_integer ----
EXTENDS Integers, FiniteSets
CONSTANT t_1
Test == Cardinality({1, t_1}) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module typed_model_value_against_integer failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the typed model value t_1 and non-model value
    1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the typed model value t_1 and non-model value
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_against_integer
    1. Line 14, column 29 to line 14, column 32 in typed_model_value_against_integer
    2. Line 12, column 9 to line 12, column 33 in typed_model_value_against_integer
    3. Line 12, column 9 to line 12, column 29 in typed_model_value_against_integer
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
    Attempted to compare the typed model value t_1 and non-model value
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in typed_model_value_against_integer
    1. Line 15, column 30 to line 15, column 33 in typed_model_value_against_integer
    2. Line 12, column 9 to line 12, column 33 in typed_model_value_against_integer
    3. Line 12, column 9 to line 12, column 29 in typed_model_value_against_integer
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the typed model value t_1 and non-model value
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_against_integer
    1. Line 16, column 8 to line 16, column 32 in typed_model_value_against_integer
    2. Line 16, column 29 to line 16, column 32 in typed_model_value_against_integer
    3. Line 12, column 9 to line 12, column 33 in typed_model_value_against_integer
    4. Line 12, column 9 to line 12, column 29 in typed_model_value_against_integer
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the typed model value t_1 and non-model value
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in typed_model_value_against_integer
    1. Line 15, column 12 to line 15, column 36 in typed_model_value_against_integer
    2. Line 15, column 33 to line 15, column 36 in typed_model_value_against_integer
    3. Line 12, column 9 to line 12, column 33 in typed_model_value_against_integer
    4. Line 12, column 9 to line 12, column 29 in typed_model_value_against_integer
---*)

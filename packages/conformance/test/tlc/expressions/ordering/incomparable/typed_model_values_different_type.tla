(*---
description: "Typed model values of different types cannot be sorted."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT t_1 = t_1
  CONSTANT u_1 = u_1
---*)
---- MODULE typed_model_values_different_type ----
EXTENDS Integers, FiniteSets
CONSTANT t_1, u_1
Test == Cardinality({t_1, u_1}) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module typed_model_values_different_type failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the differently-typed model values u_1 and t_1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the differently-typed model values u_1 and t_1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in typed_model_values_different_type
    1. Line 15, column 29 to line 15, column 32 in typed_model_values_different_type
    2. Line 13, column 9 to line 13, column 35 in typed_model_values_different_type
    3. Line 13, column 9 to line 13, column 31 in typed_model_values_different_type
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
    Attempted to compare the differently-typed model values u_1 and t_1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in typed_model_values_different_type
    1. Line 16, column 30 to line 16, column 33 in typed_model_values_different_type
    2. Line 13, column 9 to line 13, column 35 in typed_model_values_different_type
    3. Line 13, column 9 to line 13, column 31 in typed_model_values_different_type
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the differently-typed model values u_1 and t_1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in typed_model_values_different_type
    1. Line 17, column 8 to line 17, column 32 in typed_model_values_different_type
    2. Line 17, column 29 to line 17, column 32 in typed_model_values_different_type
    3. Line 13, column 9 to line 13, column 35 in typed_model_values_different_type
    4. Line 13, column 9 to line 13, column 31 in typed_model_values_different_type
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the differently-typed model values u_1 and t_1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in typed_model_values_different_type
    1. Line 16, column 12 to line 16, column 36 in typed_model_values_different_type
    2. Line 16, column 33 to line 16, column 36 in typed_model_values_different_type
    3. Line 13, column 9 to line 13, column 35 in typed_model_values_different_type
    4. Line 13, column 9 to line 13, column 31 in typed_model_values_different_type
---*)

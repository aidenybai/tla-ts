(*---
description: Typed model values of different types fail against each other.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE model_value_typed_other_type ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("T_a") = TLCModelValue("U_a")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module model_value_typed_other_type failed.
    Attempted to check equality of the differently-typed model values T_a and U_a
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of the differently-typed model values T_a and U_a
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_typed_other_type
    1. Line 14, column 29 to line 14, column 32 in model_value_typed_other_type
    2. Line 12, column 9 to line 12, column 51 in model_value_typed_other_type
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of the differently-typed model values T_a and U_a
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in model_value_typed_other_type
    1. Line 15, column 30 to line 15, column 33 in model_value_typed_other_type
    2. Line 12, column 9 to line 12, column 51 in model_value_typed_other_type
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the differently-typed model values T_a and U_a
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_typed_other_type
    1. Line 16, column 8 to line 16, column 32 in model_value_typed_other_type
    2. Line 16, column 29 to line 16, column 32 in model_value_typed_other_type
    3. Line 12, column 9 to line 12, column 51 in model_value_typed_other_type
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of the differently-typed model values T_a and U_a
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_typed_other_type
    1. Line 15, column 12 to line 15, column 36 in model_value_typed_other_type
    2. Line 15, column 33 to line 15, column 36 in model_value_typed_other_type
    3. Line 12, column 9 to line 12, column 51 in model_value_typed_other_type
---*)

(*---
description: A typed model value in Int is an error.
ref: tlc2/value/impl/ModelValue.java#modelValueMember
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
config: |
  CONSTANT T_a = T_a
---*)
---- MODULE int_typed_model_value ----
EXTENDS Integers
CONSTANT T_a
Test == T_a \in Int
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module int_typed_model_value failed.
    Attempted to check if the typed model value T_a is an element of
    Int
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check if the typed model value T_a is an element of
    Int
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in int_typed_model_value
    1. Line 17, column 29 to line 17, column 32 in int_typed_model_value
    2. Line 15, column 9 to line 15, column 19 in int_typed_model_value
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check if the typed model value T_a is an element of
    Int
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 33 in int_typed_model_value
    1. Line 18, column 30 to line 18, column 33 in int_typed_model_value
    2. Line 15, column 9 to line 15, column 19 in int_typed_model_value
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the typed model value T_a is an element of
    Int
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in int_typed_model_value
    1. Line 19, column 8 to line 19, column 32 in int_typed_model_value
    2. Line 19, column 29 to line 19, column 32 in int_typed_model_value
    3. Line 15, column 9 to line 15, column 19 in int_typed_model_value
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check if the typed model value T_a is an element of
    Int
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in int_typed_model_value
    1. Line 18, column 12 to line 18, column 36 in int_typed_model_value
    2. Line 18, column 33 to line 18, column 36 in int_typed_model_value
    3. Line 15, column 9 to line 15, column 19 in int_typed_model_value
---*)

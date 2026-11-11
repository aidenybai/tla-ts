(*---
description: "= between a Boolean and an integer is an error rather than FALSE."
ref: "tlc2/value/impl/BoolValue.java#equals"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE equal_does_not_coerce_int_to_boolean ----
EXTENDS Integers
Test == TRUE # 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module equal_does_not_coerce_int_to_boolean failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare equality of boolean TRUE with non-boolean:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equal_does_not_coerce_int_to_boolean
    1. Line 11, column 29 to line 11, column 32 in equal_does_not_coerce_int_to_boolean
    2. Line 9, column 9 to line 9, column 16 in equal_does_not_coerce_int_to_boolean
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare equality of boolean TRUE with non-boolean:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in equal_does_not_coerce_int_to_boolean
    1. Line 12, column 30 to line 12, column 33 in equal_does_not_coerce_int_to_boolean
    2. Line 9, column 9 to line 9, column 16 in equal_does_not_coerce_int_to_boolean
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare equality of boolean TRUE with non-boolean:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equal_does_not_coerce_int_to_boolean
    1. Line 13, column 8 to line 13, column 32 in equal_does_not_coerce_int_to_boolean
    2. Line 13, column 29 to line 13, column 32 in equal_does_not_coerce_int_to_boolean
    3. Line 9, column 9 to line 9, column 16 in equal_does_not_coerce_int_to_boolean
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare equality of boolean TRUE with non-boolean:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equal_does_not_coerce_int_to_boolean
    1. Line 12, column 12 to line 12, column 36 in equal_does_not_coerce_int_to_boolean
    2. Line 12, column 33 to line 12, column 36 in equal_does_not_coerce_int_to_boolean
    3. Line 9, column 9 to line 9, column 16 in equal_does_not_coerce_int_to_boolean
---*)

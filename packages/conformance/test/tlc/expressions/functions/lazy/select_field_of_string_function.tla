(*---
description: "r.a does not keep its argument lazy and converts through toFcnRcd, which cannot enumerate STRING."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rs"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE select_field_of_string_function ----
EXTENDS Integers
Test == [s \in STRING |-> s].a = "a"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module select_field_of_string_function failed.
    Attempted to compute the number of elements in the overridden value STRING.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the number of elements in the overridden value STRING.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_field_of_string_function
    1. Line 11, column 29 to line 11, column 32 in select_field_of_string_function
    2. Line 9, column 9 to line 9, column 36 in select_field_of_string_function
    3. Line 9, column 9 to line 9, column 30 in select_field_of_string_function
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the number of elements in the overridden value STRING.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in select_field_of_string_function
    1. Line 12, column 30 to line 12, column 33 in select_field_of_string_function
    2. Line 9, column 9 to line 9, column 36 in select_field_of_string_function
    3. Line 9, column 9 to line 9, column 30 in select_field_of_string_function
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value STRING.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_field_of_string_function
    1. Line 13, column 8 to line 13, column 32 in select_field_of_string_function
    2. Line 13, column 29 to line 13, column 32 in select_field_of_string_function
    3. Line 9, column 9 to line 9, column 36 in select_field_of_string_function
    4. Line 9, column 9 to line 9, column 30 in select_field_of_string_function
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute the number of elements in the overridden value STRING.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in select_field_of_string_function
    1. Line 12, column 12 to line 12, column 36 in select_field_of_string_function
    2. Line 12, column 33 to line 12, column 36 in select_field_of_string_function
    3. Line 9, column 9 to line 9, column 36 in select_field_of_string_function
    4. Line 9, column 9 to line 9, column 30 in select_field_of_string_function
---*)

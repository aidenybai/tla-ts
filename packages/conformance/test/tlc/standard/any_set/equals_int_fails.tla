(*---
description: Any = 1 is an error.
ref: tlc2/value/impl/UserValue.java#compareTo
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE equals_int_fails ----
EXTENDS TLC
Test == Any = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module equals_int_fails failed.
    Attempted to compare overridden value ANY with non-overridden value:
    1
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to compare overridden value ANY with non-overridden value:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_int_fails
    1. Line 14, column 29 to line 14, column 32 in equals_int_fails
    2. Line 12, column 9 to line 12, column 15 in equals_int_fails
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare overridden value ANY with non-overridden value:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in equals_int_fails
    1. Line 15, column 30 to line 15, column 33 in equals_int_fails
    2. Line 12, column 9 to line 12, column 15 in equals_int_fails
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value ANY with non-overridden value:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_int_fails
    1. Line 16, column 8 to line 16, column 32 in equals_int_fails
    2. Line 16, column 29 to line 16, column 32 in equals_int_fails
    3. Line 12, column 9 to line 12, column 15 in equals_int_fails
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to compare overridden value ANY with non-overridden value:
    1
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_int_fails
    1. Line 15, column 12 to line 15, column 36 in equals_int_fails
    2. Line 15, column 33 to line 15, column 36 in equals_int_fails
    3. Line 12, column 9 to line 12, column 15 in equals_int_fails
---*)

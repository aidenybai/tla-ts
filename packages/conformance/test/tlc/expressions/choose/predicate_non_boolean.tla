(*---
description: "A non-Boolean CHOOSE predicate reports the expected-value error."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE predicate_non_boolean ----
EXTENDS Integers
Test == (CHOOSE x \in {1} : 7) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
init:
  exit: 75
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in predicate_non_boolean
    1. Line 11, column 29 to line 11, column 32 in predicate_non_boolean
    2. Line 9, column 9 to line 9, column 34 in predicate_non_boolean
    3. Line 9, column 10 to line 9, column 29 in predicate_non_boolean
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2215:0 @!@!@
    TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2215:0 @!@!@
    TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in predicate_non_boolean
    1. Line 12, column 30 to line 12, column 33 in predicate_non_boolean
    2. Line 9, column 9 to line 9, column 34 in predicate_non_boolean
    3. Line 9, column 10 to line 9, column 29 in predicate_non_boolean
invariant:
  exit: 75
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    | While working on the initial state:
    | conformance_state = TRUE
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in predicate_non_boolean
    1. Line 13, column 8 to line 13, column 32 in predicate_non_boolean
    2. Line 13, column 29 to line 13, column 32 in predicate_non_boolean
    3. Line 9, column 9 to line 9, column 34 in predicate_non_boolean
    4. Line 9, column 10 to line 9, column 29 in predicate_non_boolean
property:
  exit: 75
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    | While working on the initial state:
    | conformance_state = TRUE
    2215:0 TLC expected a boolean value, but did not find one. line 9, col 10 to line 9, col 29 of module predicate_non_boolean
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in predicate_non_boolean
    1. Line 12, column 12 to line 12, column 36 in predicate_non_boolean
    2. Line 12, column 33 to line 12, column 36 in predicate_non_boolean
    3. Line 9, column 9 to line 9, column 34 in predicate_non_boolean
    4. Line 9, column 10 to line 9, column 29 in predicate_non_boolean
---*)

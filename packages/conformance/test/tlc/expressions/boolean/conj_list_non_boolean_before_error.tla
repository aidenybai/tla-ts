(*---
description: "A conjunction list evaluates in order, so a non-Boolean bullet wins over a later division by zero."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE conj_list_non_boolean_before_error ----
EXTENDS Integers
Test ==
  /\ 7
  /\ 1 \div 0 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 11 of module conj_list_non_boolean_before_error failed.
    A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
init:
  exit: 75
  transcript: |-
    1000:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in conj_list_non_boolean_before_error
    1. Line 13, column 29 to line 13, column 32 in conj_list_non_boolean_before_error
    2. Line 10, column 3 to line 11, column 17 in conj_list_non_boolean_before_error
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 33 in conj_list_non_boolean_before_error
    1. Line 14, column 30 to line 14, column 33 in conj_list_non_boolean_before_error
    2. Line 10, column 3 to line 11, column 17 in conj_list_non_boolean_before_error
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in conj_list_non_boolean_before_error
    1. Line 15, column 8 to line 15, column 32 in conj_list_non_boolean_before_error
    2. Line 15, column 29 to line 15, column 32 in conj_list_non_boolean_before_error
    3. Line 10, column 3 to line 11, column 17 in conj_list_non_boolean_before_error
property:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in conj_list_non_boolean_before_error
    1. Line 14, column 12 to line 14, column 36 in conj_list_non_boolean_before_error
    2. Line 14, column 33 to line 14, column 36 in conj_list_non_boolean_before_error
    3. Line 10, column 3 to line 11, column 17 in conj_list_non_boolean_before_error
---*)

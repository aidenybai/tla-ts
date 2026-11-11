(*---
description: "A one-bullet conjunction list still checks that its bullet is a Boolean."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE conj_list_single_non_boolean ----
EXTENDS Integers
Test ==
  /\ 7
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module conj_list_single_non_boolean failed.
    A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
init:
  exit: 75
  transcript: |-
    1000:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in conj_list_single_non_boolean
    1. Line 12, column 29 to line 12, column 32 in conj_list_single_non_boolean
    2. Line 10, column 3 to line 10, column 6 in conj_list_single_non_boolean
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
    0. Line 13, column 9 to line 13, column 33 in conj_list_single_non_boolean
    1. Line 13, column 30 to line 13, column 33 in conj_list_single_non_boolean
    2. Line 10, column 3 to line 10, column 6 in conj_list_single_non_boolean
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in conj_list_single_non_boolean
    1. Line 14, column 8 to line 14, column 32 in conj_list_single_non_boolean
    2. Line 14, column 29 to line 14, column 32 in conj_list_single_non_boolean
    3. Line 10, column 3 to line 10, column 6 in conj_list_single_non_boolean
property:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a formula in a conjunction.
    7
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in conj_list_single_non_boolean
    1. Line 13, column 12 to line 13, column 36 in conj_list_single_non_boolean
    2. Line 13, column 33 to line 13, column 36 in conj_list_single_non_boolean
    3. Line 10, column 3 to line 10, column 6 in conj_list_single_non_boolean
---*)

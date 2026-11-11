(*---
description: "A non-Boolean bullet in a disjunction list reports the disjunction message."
ref: "tlc2/tool/impl/Tool.java#OPCODE_dl"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE disj_list_non_boolean_message ----
EXTENDS Integers
Test ==
  \/ FALSE
  \/ "s"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 11 of module disj_list_non_boolean_message failed.
    A non-boolean expression (a string) was used as a formula in a disjunction.
    line 11, col 6 to line 11, col 8 of module disj_list_non_boolean_message
init:
  exit: 75
  transcript: |-
    1000:1 A non-boolean expression (a string) was used as a formula in a disjunction.
    line 11, col 6 to line 11, col 8 of module disj_list_non_boolean_message
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in disj_list_non_boolean_message
    1. Line 13, column 29 to line 13, column 32 in disj_list_non_boolean_message
    2. Line 10, column 3 to line 11, column 8 in disj_list_non_boolean_message
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : A non-boolean expression (a string) was used as a formula in a disjunction.
    line 11, col 6 to line 11, col 8 of module disj_list_non_boolean_message
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 33 in disj_list_non_boolean_message
    1. Line 14, column 30 to line 14, column 33 in disj_list_non_boolean_message
    2. Line 10, column 3 to line 11, column 8 in disj_list_non_boolean_message
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (a string) was used as a formula in a disjunction.
    line 11, col 6 to line 11, col 8 of module disj_list_non_boolean_message
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in disj_list_non_boolean_message
    1. Line 15, column 8 to line 15, column 32 in disj_list_non_boolean_message
    2. Line 15, column 29 to line 15, column 32 in disj_list_non_boolean_message
    3. Line 10, column 3 to line 11, column 8 in disj_list_non_boolean_message
property:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (a string) was used as a formula in a disjunction.
    line 11, col 6 to line 11, col 8 of module disj_list_non_boolean_message
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 32 in disj_list_non_boolean_message
    1. Line 14, column 12 to line 14, column 36 in disj_list_non_boolean_message
    2. Line 14, column 33 to line 14, column 36 in disj_list_non_boolean_message
    3. Line 10, column 3 to line 11, column 8 in disj_list_non_boolean_message
---*)

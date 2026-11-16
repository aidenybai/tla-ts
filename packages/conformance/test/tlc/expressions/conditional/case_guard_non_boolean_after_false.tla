(*---
description: "A non-Boolean guard reached after a false guard is an error."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE case_guard_non_boolean_after_false ----
EXTENDS Integers
Test == CASE FALSE -> TRUE [] 3 -> TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module case_guard_non_boolean_after_false failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. 3
init:
  exit: 75
  transcript: |-
    1000:1 A non-boolean expression (an integer) was used as a condition of a CASE. 3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_non_boolean_after_false
    1. Line 11, column 29 to line 11, column 32 in case_guard_non_boolean_after_false
    2. Line 9, column 9 to line 9, column 39 in case_guard_non_boolean_after_false
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : A non-boolean expression (an integer) was used as a condition of a CASE. 3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in case_guard_non_boolean_after_false
    1. Line 12, column 30 to line 12, column 33 in case_guard_non_boolean_after_false
    2. Line 9, column 9 to line 9, column 39 in case_guard_non_boolean_after_false
invariant:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a condition of a CASE. 3
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_non_boolean_after_false
    1. Line 13, column 8 to line 13, column 32 in case_guard_non_boolean_after_false
    2. Line 13, column 29 to line 13, column 32 in case_guard_non_boolean_after_false
    3. Line 9, column 9 to line 9, column 39 in case_guard_non_boolean_after_false
property:
  exit: 75
  transcript: |-
    2102:1 A non-boolean expression (an integer) was used as a condition of a CASE. 3
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_guard_non_boolean_after_false
    1. Line 12, column 12 to line 12, column 36 in case_guard_non_boolean_after_false
    2. Line 12, column 33 to line 12, column 36 in case_guard_non_boolean_after_false
    3. Line 9, column 9 to line 9, column 39 in case_guard_non_boolean_after_false
---*)

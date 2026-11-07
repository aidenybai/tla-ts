(*---
description: "CASE with no true guard and no OTHER is an error."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE case_no_guard_true ----
EXTENDS Integers
Test == CASE FALSE -> TRUE [] 1 = 2 -> TRUE
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module case_no_guard_true failed.
    Attempted to evaluate a CASE with no conditions true.
    line 9, col 9 to line 9, col 43 of module case_no_guard_true
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to evaluate a CASE with no conditions true.
    line 9, col 9 to line 9, col 43 of module case_no_guard_true
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_no_guard_true
    1. Line 11, column 29 to line 11, column 32 in case_no_guard_true
    2. Line 9, column 9 to line 9, column 43 in case_no_guard_true
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to evaluate a CASE with no conditions true.
    line 9, col 9 to line 9, col 43 of module case_no_guard_true
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in case_no_guard_true
    1. Line 12, column 30 to line 12, column 33 in case_no_guard_true
    2. Line 9, column 9 to line 9, column 43 in case_no_guard_true
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate a CASE with no conditions true.
    line 9, col 9 to line 9, col 43 of module case_no_guard_true
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_no_guard_true
    1. Line 13, column 8 to line 13, column 32 in case_no_guard_true
    2. Line 13, column 29 to line 13, column 32 in case_no_guard_true
    3. Line 9, column 9 to line 9, column 43 in case_no_guard_true
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate a CASE with no conditions true.
    line 9, col 9 to line 9, col 43 of module case_no_guard_true
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in case_no_guard_true
    1. Line 12, column 12 to line 12, column 36 in case_no_guard_true
    2. Line 12, column 33 to line 12, column 36 in case_no_guard_true
    3. Line 9, column 9 to line 9, column 43 in case_no_guard_true
---*)

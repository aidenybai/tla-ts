(*---
description: "A non-Boolean on either side of <=> gets one message that names neither side."
ref: "tlc2/tool/impl/Tool.java#OPCODE_equiv"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE equiv_reports_both_sides_together ----
EXTENDS Integers
Test == TRUE <=> 7
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module equiv_reports_both_sides_together failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 9, col 9 to line 9, col 18 of module equiv_reports_both_sides_together
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 9, col 9 to line 9, col 18 of module equiv_reports_both_sides_together
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_reports_both_sides_together
    1. Line 11, column 29 to line 11, column 32 in equiv_reports_both_sides_together
    2. Line 9, column 9 to line 9, column 18 in equiv_reports_both_sides_together
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 9, col 9 to line 9, col 18 of module equiv_reports_both_sides_together
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in equiv_reports_both_sides_together
    1. Line 12, column 30 to line 12, column 33 in equiv_reports_both_sides_together
    2. Line 9, column 9 to line 9, column 18 in equiv_reports_both_sides_together
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 9, col 9 to line 9, col 18 of module equiv_reports_both_sides_together
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_reports_both_sides_together
    1. Line 13, column 8 to line 13, column 32 in equiv_reports_both_sides_together
    2. Line 13, column 29 to line 13, column 32 in equiv_reports_both_sides_together
    3. Line 9, column 9 to line 9, column 18 in equiv_reports_both_sides_together
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 9, col 9 to line 9, col 18 of module equiv_reports_both_sides_together
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in equiv_reports_both_sides_together
    1. Line 12, column 12 to line 12, column 36 in equiv_reports_both_sides_together
    2. Line 12, column 33 to line 12, column 36 in equiv_reports_both_sides_together
    3. Line 9, column 9 to line 9, column 18 in equiv_reports_both_sides_together
---*)

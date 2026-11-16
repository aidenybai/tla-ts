(*---
description: CASE with no true guard has the next-states message, and it reports the initial state.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_case
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE case_no_true_guard ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == CASE x = 1 -> x' = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In computing next states, TLC encountered a CASE with no conditions true.
    line 13, col 9 to line 13, col 28 of module case_no_true_guard
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in case_no_true_guard
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

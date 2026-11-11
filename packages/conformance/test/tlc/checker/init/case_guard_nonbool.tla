(*---
description: A non-Boolean CASE guard has its own initial-states message, which shows the arm.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_case
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE case_guard_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == CASE 1 -> x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, a non-boolean expression (an integer) was used as a guard condition of a CASE.
    line 13, col 19 to line 13, col 23 of module case_guard_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 23 in case_guard_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

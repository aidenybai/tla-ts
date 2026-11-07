(*---
description: The IF guard evaluates in the partial state, so it fails if it reads an unassigned variable.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_ite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE if_guard_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == IF x = 1 THEN x = 1 ELSE x = 2
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 12 to line 13, col 12 of module if_guard_unassigned
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 12 to line 13, col 12 of module if_guard_unassigned
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 38 in if_guard_unassigned
    1. Line 13, column 12 to line 13, column 16 in if_guard_unassigned
    2. Line 13, column 12 to line 13, column 12 in if_guard_unassigned
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

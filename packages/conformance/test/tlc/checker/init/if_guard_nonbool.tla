(*---
description: A non-Boolean IF guard has its own initial-states message.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_ite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE if_guard_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == IF 1 THEN x = 1 ELSE x = 2
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, a non-boolean expression (an integer) was used as the condition of an IF.
    line 13, col 9 to line 13, col 34 of module if_guard_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 34 in if_guard_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

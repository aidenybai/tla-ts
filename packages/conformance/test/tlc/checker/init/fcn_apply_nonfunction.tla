(*---
description: e[1] where e isn't a function in the generator path has the initial-states message.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_fa
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_nonfunction ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
I == 3
Init == I[1] /\ x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, a non-function (an integer) was applied as a function.
    line 14, col 9 to line 14, col 12 of module fcn_apply_nonfunction
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 21 in fcn_apply_nonfunction
    1. Line 14, column 9 to line 14, column 12 in fcn_apply_nonfunction
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

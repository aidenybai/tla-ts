(*---
description: f[e] with a non-Boolean value in the generator path uses the message without the value.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_fa
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == <<1, 2>>[1] /\ x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2248:0 In computing initial states, TLC expected a boolean expression,
    but didn't find one.
    line 13, col 9 to line 13, col 19 of module fcn_apply_nonbool
    2248:0 In computing initial states, TLC expected a boolean expression,
    but didn't find one.
    line 13, col 9 to line 13, col 19 of module fcn_apply_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in fcn_apply_nonbool
    1. Line 13, column 9 to line 13, column 19 in fcn_apply_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

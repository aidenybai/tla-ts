(*---
description: f[e] with a non-Boolean value after every variable is assigned uses the fast path's message, which shows the value.
ref: tlc2/tool/impl/Tool.java#getInitStates
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_nonbool_fast_path ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ <<1, 2>>[1]
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 1.
    line 13, col 18 to line 13, col 28 of module fcn_apply_nonbool_fast_path
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 1.
    line 13, col 18 to line 13, col 28 of module fcn_apply_nonbool_fast_path
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in fcn_apply_nonbool_fast_path
    1. Line 13, column 9 to line 13, column 13 in fcn_apply_nonbool_fast_path
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

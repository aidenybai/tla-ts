(*---
description: e[1] where e isn't a function after every variable is assigned has the evaluator's message.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_nonfunction_fast_path ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
I == 3
Init == x = 1 /\ I[1]
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 A non-function (an integer) was applied as a function.
    line 14, col 18 to line 14, col 21 of module fcn_apply_nonfunction_fast_path
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 21 in fcn_apply_nonfunction_fast_path
    1. Line 14, column 9 to line 14, column 13 in fcn_apply_nonfunction_fast_path
    2. Line 14, column 18 to line 14, column 21 in fcn_apply_nonfunction_fast_path
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

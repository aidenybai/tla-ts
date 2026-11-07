(*---
description: An evaluation error in a VIEW on an initial state is reported as the initial-state error.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  VIEW V
---*)
---- MODULE error_eval_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V == 1 \div x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in error_eval_initial
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

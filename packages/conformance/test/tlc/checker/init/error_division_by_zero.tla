(*---
description: Evaluation errors while computing the initial states are reported with the nested expression stack, not a state, when no state exists yet.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_division_by_zero ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 \div 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 20 in error_division_by_zero
    1. Line 13, column 13 to line 13, column 20 in error_division_by_zero
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

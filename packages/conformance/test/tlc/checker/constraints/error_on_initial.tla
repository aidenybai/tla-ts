(*---
description: An evaluation error in a constraint on an initial state prints the state.
ref: tlc2/tool/impl/Tool.java#isInModel
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE error_on_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Con == 1 \div x > 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in error_on_initial
    1. Line 15, column 8 to line 15, column 19 in error_on_initial
    2. Line 15, column 8 to line 15, column 15 in error_on_initial
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

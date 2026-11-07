(*---
description: An evaluation error in an invariant on an initial state reports the state and stack.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE error_on_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == 1 \div x > 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in error_on_initial
    1. Line 15, column 8 to line 15, column 19 in error_on_initial
    2. Line 15, column 8 to line 15, column 15 in error_on_initial
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: An evaluation error in the right side of x' = e prints the behavior and the stack of nested expressions.
ref: tlc2/tool/ModelChecker.java#doNextFailed
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_rhs_assignment ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 21 in error_rhs_assignment
    1. Line 13, column 14 to line 13, column 21 in error_rhs_assignment
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: An argument that fails to evaluate while splitting is swallowed, leaving one unsplit action, and the error returns during next-state generation.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE constant_argument_failure_swallowed ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Op(v) == x' = v \/ x' = 2
Next == Op(1 \div 0)
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
    0. Line 16, column 9 to line 16, column 20 in constant_argument_failure_swallowed
    1. Line 15, column 10 to line 15, column 25 in constant_argument_failure_swallowed
    2. Line 15, column 10 to line 15, column 15 in constant_argument_failure_swallowed
    3. Line 15, column 15 to line 15, column 15 in constant_argument_failure_swallowed
    4. Line 16, column 12 to line 16, column 19 in constant_argument_failure_swallowed
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

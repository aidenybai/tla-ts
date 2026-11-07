(*---
description: "x \\notin S never assigns x: it falls to the default case and evaluates x."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE notin_not_assignment ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \notin {1}
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 9 to line 13, col 9 of module notin_not_assignment
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 9 to line 13, col 9 of module notin_not_assignment
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 20 in notin_not_assignment
    1. Line 13, column 9 to line 13, column 9 in notin_not_assignment
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

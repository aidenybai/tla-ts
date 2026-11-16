(*---
description: x \in Nat is an error when x is unassigned, because Nat is not Enumerable.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_nat_not_enumerable ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in Nat
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, the right side of \IN is not enumerable.
    line 13, col 9 to line 13, col 17 of module in_nat_not_enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 17 in in_nat_not_enumerable
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

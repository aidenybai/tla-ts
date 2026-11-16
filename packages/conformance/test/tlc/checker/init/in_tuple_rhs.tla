(*---
description: x \in <<1, 2>> is an error, because a tuple is not Enumerable as a set here.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE in_tuple_rhs ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in <<1, 2>>
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states, the right side of \IN is not enumerable.
    line 13, col 9 to line 13, col 22 of module in_tuple_rhs
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 22 in in_tuple_rhs
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

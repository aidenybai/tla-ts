(*---
description: An unbounded \E in Init falls to the default case and evaluation reports that TLC can't enumerate it.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_unbounded ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == \E v : x = v
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 TLC attempted to evaluate an unbounded \E.
    Make sure that the expression is of form \E x \in S: P(x).
    line 13, col 9 to line 13, col 20 of module exists_unbounded
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 20 in exists_unbounded
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

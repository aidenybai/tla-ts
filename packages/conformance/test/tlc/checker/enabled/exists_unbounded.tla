(*---
description: ENABLED of an unbounded \E has its own message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_unbounded ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (\E i : x' = i))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 In computing ENABLED, TLC encountered unbounded quantifier. Make sure that the expression is of form \E x \in S: P(x).
    line 15, col 24 to line 15, col 36 of module exists_unbounded
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in exists_unbounded
    1. Line 15, column 8 to line 15, column 38 in exists_unbounded
    2. Line 15, column 15 to line 15, column 37 in exists_unbounded
    3. Line 15, column 24 to line 15, column 36 in exists_unbounded
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

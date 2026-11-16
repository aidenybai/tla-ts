(*---
description: "ENABLED of x' \\in Nat on an unassigned x' fails saying the right side of \\in isn't enumerable."
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE in_nat ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (x' \in Nat))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 The right side of \IN is not enumerable.
    line 15, col 24 to line 15, col 33 of module in_nat
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in in_nat
    1. Line 15, column 8 to line 15, column 35 in in_nat
    2. Line 15, column 15 to line 15, column 34 in in_nat
    3. Line 15, column 24 to line 15, column 33 in in_nat
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

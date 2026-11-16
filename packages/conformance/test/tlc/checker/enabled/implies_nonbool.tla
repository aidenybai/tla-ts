(*---
description: ENABLED of P => Q with a non-Boolean P has its own message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE implies_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (1 => x' = 1))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While computing ENABLED of an expression of the form P => Q, P was an integer.
    line 15, col 24 to line 15, col 34 of module implies_nonbool
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in implies_nonbool
    1. Line 15, column 8 to line 15, column 36 in implies_nonbool
    2. Line 15, column 15 to line 15, column 35 in implies_nonbool
    3. Line 15, column 24 to line 15, column 34 in implies_nonbool
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

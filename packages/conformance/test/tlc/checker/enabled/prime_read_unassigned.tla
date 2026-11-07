(*---
description: "ENABLED of a guard on x' before its assignment fails with the undefined identifier message."
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE prime_read_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (x' > 0 /\ x' = 1))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 24 to line 15, col 24 of module prime_read_unassigned
    | While working on the initial state:
    | x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 24 to line 15, col 24 of module prime_read_unassigned
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in prime_read_unassigned
    1. Line 15, column 8 to line 15, column 41 in prime_read_unassigned
    2. Line 15, column 15 to line 15, column 40 in prime_read_unassigned
    3. Line 15, column 24 to line 15, column 39 in prime_read_unassigned
    4. Line 15, column 24 to line 15, column 29 in prime_read_unassigned
    5. Line 15, column 24 to line 15, column 25 in prime_read_unassigned
    6. Line 15, column 24 to line 15, column 24 in prime_read_unassigned
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

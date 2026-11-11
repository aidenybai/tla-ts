(*---
description: ENABLED of IF with a non-Boolean guard has its own message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE if_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (IF 1 THEN x' = 1 ELSE x' = 2))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 In computing ENABLED, a non-boolean expression(an integer) was used as the guard condition of an IF.
    line 15, col 24 to line 15, col 51 of module if_nonbool
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in if_nonbool
    1. Line 15, column 8 to line 15, column 53 in if_nonbool
    2. Line 15, column 15 to line 15, column 52 in if_nonbool
    3. Line 15, column 24 to line 15, column 51 in if_nonbool
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

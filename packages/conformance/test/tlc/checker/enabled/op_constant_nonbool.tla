(*---
description: ENABLED of a constant operator that isn't Boolean has the expected-Boolean message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE op_constant_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
C == 1
Inv == PrintT(ENABLED C)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2247:0 In computing ENABLED, TLC expected a boolean expression,
    but instead found 1.
    line 16, col 23 to line 16, col 23 of module op_constant_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in op_constant_nonbool
    1. Line 16, column 8 to line 16, column 24 in op_constant_nonbool
    2. Line 16, column 15 to line 16, column 23 in op_constant_nonbool
    3. Line 16, column 23 to line 16, column 23 in op_constant_nonbool
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

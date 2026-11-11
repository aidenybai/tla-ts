(*---
description: ENABLED of a non-function applied has its own message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE fcn_nonfunction ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
F == 3
Inv == PrintT(ENABLED F[1])
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 In computing ENABLED, a non-function (an integer) was applied as a function.
    line 16, col 23 to line 16, col 26 of module fcn_nonfunction
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in fcn_nonfunction
    1. Line 16, column 8 to line 16, column 27 in fcn_nonfunction
    2. Line 16, column 15 to line 16, column 26 in fcn_nonfunction
    3. Line 16, column 23 to line 16, column 26 in fcn_nonfunction
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

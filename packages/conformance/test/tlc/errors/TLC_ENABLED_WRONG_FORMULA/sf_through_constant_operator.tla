(*---
description: A constant operator replaced by a definition puts SF under ENABLED, past SANY's level check, which TLC reports here.
ref: tlc2/tool/impl/Tool.java#enabledAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT C <- G
---*)
---- MODULE sf_through_constant_operator ----
EXTENDS Naturals
CONSTANT C(_)
VARIABLE x
vars == x
A == x' = x
P == x = 0
G(a) == SF_vars(A)
Init == x = 0
Next == x' = x
Inv == ENABLED C(1)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2260:0 In computing ENABLED, TLC encountered a temporal formula (SF).
    line 18, col 9 to line 18, col 18 of module sf_through_constant_operator
    | While working on the initial state:
    | x = 0
    2260:0 In computing ENABLED, TLC encountered a temporal formula (SF).
    line 18, col 9 to line 18, col 18 of module sf_through_constant_operator
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 13 in sf_through_constant_operator
    1. Line 21, column 8 to line 21, column 19 in sf_through_constant_operator
    2. Line 21, column 16 to line 21, column 19 in sf_through_constant_operator
    3. Line 18, column 9 to line 18, column 18 in sf_through_constant_operator
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

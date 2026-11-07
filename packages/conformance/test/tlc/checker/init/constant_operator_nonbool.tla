(*---
description: A user-defined constant operator that isn't Boolean fails when the generator uses it as a predicate.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE constant_operator_nonbool ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
C == 1
Init == x = 1 /\ C /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 1.
    line 14, col 18 to line 14, col 18 of module constant_operator_nonbool
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 1.
    line 14, col 18 to line 14, col 18 of module constant_operator_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 27 in constant_operator_nonbool
    1. Line 14, column 9 to line 14, column 18 in constant_operator_nonbool
    2. Line 14, column 9 to line 14, column 13 in constant_operator_nonbool
    3. Line 14, column 18 to line 14, column 18 in constant_operator_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

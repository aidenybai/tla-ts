(*---
description: A constant zero-arity operator before every variable has a value fails with the generator's expected-Boolean message.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_user_operator_nonbool ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
C == 1
Init == C /\ x = 1 /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 1.
    line 14, col 9 to line 14, col 9 of module generator_user_operator_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 27 in generator_user_operator_nonbool
    1. Line 14, column 9 to line 14, column 18 in generator_user_operator_nonbool
    2. Line 14, column 9 to line 14, column 9 in generator_user_operator_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

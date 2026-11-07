(*---
description: A non-Boolean conjunct in Init is refused while computing initial states.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE non_boolean_init_conjunct ----
VARIABLE x
Init == x = 0 /\ 3
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 3.
    3
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 3.
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 18 in non_boolean_init_conjunct
    1. Line 11, column 9 to line 11, column 13 in non_boolean_init_conjunct
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

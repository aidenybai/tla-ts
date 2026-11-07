(*---
description: A numeral conjunct after all variables are assigned goes through the fast path, which has a different message.
ref: tlc2/tool/impl/Tool.java#getInitStates
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE numeral_conjunct_all_assigned ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ 5
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 5.
    5
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 5.
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 18 in numeral_conjunct_all_assigned
    1. Line 13, column 9 to line 13, column 13 in numeral_conjunct_all_assigned
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

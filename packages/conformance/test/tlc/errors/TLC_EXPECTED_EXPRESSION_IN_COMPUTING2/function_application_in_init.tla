(*---
description: A function application that isn't Boolean as an Init conjunct is refused.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE function_application_in_init ----
VARIABLE x
f == [e \in {1} |-> 3]
Init == x = 0 /\ f[1]
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 3.
    line 12, col 18 to line 12, col 21 of module function_application_in_init
    2247:0 In computing initial states, TLC expected a boolean expression,
    but instead found 3.
    line 12, col 18 to line 12, col 21 of module function_application_in_init
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 21 in function_application_in_init
    1. Line 12, column 9 to line 12, column 13 in function_application_in_init
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

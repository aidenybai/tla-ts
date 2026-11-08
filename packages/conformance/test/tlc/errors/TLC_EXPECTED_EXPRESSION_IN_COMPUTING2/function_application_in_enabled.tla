(*---
description: A function application that isn't Boolean under ENABLED is refused.
ref: tlc2/tool/impl/Tool.java#enabledAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE function_application_in_enabled ----
VARIABLE x
f == [e \in {1} |-> 3]
Init == x = 0
Next == x' = x
Inv == ENABLED (x' = x /\ f[1])
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2248:0 In computing ENABLED, TLC expected a boolean expression,
    but didn't find one.
    line 15, col 27 to line 15, col 30 of module function_application_in_enabled
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in function_application_in_enabled
    1. Line 15, column 8 to line 15, column 31 in function_application_in_enabled
    2. Line 15, column 17 to line 15, column 30 in function_application_in_enabled
    3. Line 15, column 17 to line 15, column 22 in function_application_in_enabled
    4. Line 15, column 27 to line 15, column 30 in function_application_in_enabled
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

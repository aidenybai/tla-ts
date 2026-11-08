(*---
description: 'A VIEW with a prime fails where it is evaluated.'
ref: tlc2/tool/impl/Tool.java#getViewSpec
features: [liveness, view]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  VIEW Vw
  PROPERTY Prop
---*)
---- MODULE view_not_a_state_function_is_error ----
EXTENDS Naturals
VARIABLES x, h
Next == x' = (x + 1) % 2 /\ h' = (h + 1) % 3
Spec == x = 0 /\ h = 0 /\ [][Next]_<<x, h>> /\ WF_<<x, h>>(Next)
Vw == x'
Prop == <>(x = 0)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2102:1 While working on the initial state:
    /\ h = 0
    /\ x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 7 to line 16, col 7 of module view_not_a_state_function_is_error
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in view_not_a_state_function_is_error
    1. Line 15, column 18 to line 15, column 22 in view_not_a_state_function_is_error
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

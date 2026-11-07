(*---
description: 'ENABLED reading x'' before it is bound gets the generic undefined error, exit 151.'
ref: tlc2/tool/impl/Tool.java#enabled
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE enabled_primed_read_before_bound ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>ENABLED (x' > x)
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 20 to line 16, col 20 of module enabled_primed_read_before_bound
    | While working on the initial state:
    | x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 20 to line 16, col 20 of module enabled_primed_read_before_bound
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: 'ENABLED over an unbounded \E fails with its dedicated message.'
ref: tlc2/tool/impl/Tool.java#enabled
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE enabled_unbounded_exists ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>ENABLED (\E n : x' = n)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2102:1 In computing ENABLED, TLC encountered unbounded quantifier. Make sure that the expression is of form \E x \in S: P(x).
    line 16, col 20 to line 16, col 32 of module enabled_unbounded_exists
    While working on the initial state:
    x = 0
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

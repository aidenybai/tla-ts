(*---
description: 'An argument out of the domain makes getFcnContext fail, the failure is swallowed, and the level-based branch evaluates and reports it per state.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE fcn_apply_arg_out_of_domain ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>([i \in {2} |-> x = 2][3])
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2102:1 In applying the function
    (2 :> FALSE),
    the first argument is:
    3
    which is not in its domain.

    While working on the initial state:
    x = 0
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: 'In the initial state, invariants are evaluated before implied inits.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE conjunct_implied_init_before_invariant_order ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 99 /\ [](x = 98)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant line 16, col 19 to line 16, col 28 of module conjunct_implied_init_before_invariant_order is violated by the initial state:
    x = 0
---*)

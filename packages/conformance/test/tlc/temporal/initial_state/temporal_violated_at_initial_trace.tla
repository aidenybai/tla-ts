(*---
description: 'A state-level conjunct next to a temporal one splits off as an implied init, named by its location, and the implied init fails first.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_violated_at_initial_trace ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 1 /\ <>(x = 2)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2108:1 Property line 16, col 9 to line 16, col 13 of module temporal_violated_at_initial_trace is violated by the initial state:
    x = 0
---*)

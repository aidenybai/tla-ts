(*---
description: 'A translation error from an implied temporal happens at startup, before any initial state.'
ref: tlc2/tool/AbstractChecker.java#AbstractChecker
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY P1 P2
  CHECK_DEADLOCK FALSE
---*)
---- MODULE initial_invariant_before_temporal_error ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
P1 == x = 1
P2 == <>(x = 1) <=> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2255:3 The formula P1 is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula P1 holds in all states of every behavior, use INVARIANT P1 instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula P1 changes it into a temporal formula, asserting that P1 holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2213:1 TLC cannot handle the temporal formula line 17, col 7 to line 17, col 29 of module initial_invariant_before_temporal_error
---*)

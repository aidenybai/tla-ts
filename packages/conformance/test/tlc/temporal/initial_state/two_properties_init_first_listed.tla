(*---
description: 'Implied inits are checked in config order.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY P2 P1
  CHECK_DEADLOCK FALSE
---*)
---- MODULE two_properties_init_first_listed ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
P1 == x = 1
P2 == x = 2
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2255:3 The formula P2 is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula P2 holds in all states of every behavior, use INVARIANT P2 instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula P2 changes it into a temporal formula, asserting that P2 holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2255:3 The formula P1 is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula P1 holds in all states of every behavior, use INVARIANT P1 instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula P1 changes it into a temporal formula, asserting that P1 holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2108:1 Property P2 is violated by the initial state:
    x = 0
---*)

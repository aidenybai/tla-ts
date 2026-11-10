(*---
description: 'The tautology check precedes any look at the body, so a state-level body gets it too, after the state-level warning.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_empty_state_body ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \A n \in {} : x = n
====

(*--- recorded
all:
  exit: 77
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)

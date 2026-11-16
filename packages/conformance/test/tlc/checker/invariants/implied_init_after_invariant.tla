(*---
description: An invariant is checked before an implied initial predicate.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  PROPERTY Prop
---*)
---- MODULE implied_init_after_invariant ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x > 0
Prop == x > 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)

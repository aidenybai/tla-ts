(*---
description: A false implied initial predicate is reported under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
args:
  - -dfid
  - "10"
---*)
---- MODULE implied_init_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Prop == x = 1
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2108:1 Property Prop is violated by the initial state:
    x = 0
---*)

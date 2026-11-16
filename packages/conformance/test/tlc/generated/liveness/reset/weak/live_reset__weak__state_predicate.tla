(*---
description: Checks state_predicate on the reset machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_reset__weak__state_predicate ----
EXTENDS Integers
VARIABLE x
Next == x' = IF x = 0 THEN 2 ELSE x - 1
Spec == x = 2 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 0
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2108:1 Property Prop is violated by the initial state:
    x = 2
---*)

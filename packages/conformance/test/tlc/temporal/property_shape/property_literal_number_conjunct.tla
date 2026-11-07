(*---
description: 'A non-Boolean literal has no OpApplNode case, so it is an implied initial predicate that fails on evaluation.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE property_literal_number_conjunct ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == 1 /\ x = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2215:0 TLC expected a boolean value, but did not find one. 1
    | While working on the initial state:
    | x = 0
    2215:0 TLC expected a boolean value, but did not find one. 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in property_literal_number_conjunct
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

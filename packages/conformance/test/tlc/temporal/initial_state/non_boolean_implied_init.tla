(*---
description: 'A state-level non-Boolean implied init fails with a boolean-expected error.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE non_boolean_implied_init ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2215:0 TLC expected a boolean value, but did not find one. line 16, col 9 to line 16, col 9 of module non_boolean_implied_init
    | While working on the initial state:
    | x = 0
    2215:0 TLC expected a boolean value, but did not find one. line 16, col 9 to line 16, col 9 of module non_boolean_implied_init
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in non_boolean_implied_init
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

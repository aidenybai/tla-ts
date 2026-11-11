(*---
description: An error in an implied initial predicate reports the initial-state error.
ref: tlc2/tool/ModelChecker.java#doInit
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
---*)
---- MODULE error_in_implied_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Prop == 1 \div x = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in error_in_implied_init
    1. Line 15, column 9 to line 15, column 20 in error_in_implied_init
    2. Line 15, column 9 to line 15, column 16 in error_in_implied_init
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

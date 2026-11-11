(*---
description: 'An evaluation error in an implied init fails with the initial state as context.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE eval_error_in_implied_init ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x + "a" = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2102:1 While working on the initial state:
    x = 0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in eval_error_in_implied_init
    1. Line 16, column 9 to line 16, column 19 in eval_error_in_implied_init
    2. Line 16, column 9 to line 16, column 15 in eval_error_in_implied_init
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

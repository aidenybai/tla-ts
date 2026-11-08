(*---
description: 'An ALIAS that fails to evaluate on a state keeps that state''s printing as a fallback.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  ALIAS Al
---*)
---- MODULE alias_error_in_trace ----
EXTENDS Naturals
VARIABLE x
Next == x' = 1 - x
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Al == [bad |-> x + "a"]
Prop == <>[](x = 0)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ _ALIASEvalError = "
    "
    2154:0 \nAttempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue\n
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module alias_error_in_trace>
    /\ x = 1
    /\ _ALIASEvalError = "
    "
    2154:0 \nAttempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue\n
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 18 of module alias_error_in_trace>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

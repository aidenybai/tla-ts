(*---
description: 'With a false body the subscript is evaluated, and its error is an evaluation failure of the action property, exit 75.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE subscript_eval_error_when_body_false ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][x' = x]_(x + "a")
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module subscript_eval_error_when_body_false>
    x = 1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 11 to line 16, column 28 in subscript_eval_error_when_body_false
    1. Line 16, column 21 to line 16, column 27 in subscript_eval_error_when_body_false
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

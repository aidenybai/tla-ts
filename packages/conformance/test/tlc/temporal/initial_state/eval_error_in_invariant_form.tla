(*---
description: 'An evaluation error in a []P initial check is an invariant evaluation failure.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE eval_error_in_invariant_form ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](x + "a" = 1)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    | While working on the initial state:
    | x = 0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 13 in eval_error_in_invariant_form
    1. Line 16, column 12 to line 16, column 22 in eval_error_in_invariant_form
    2. Line 16, column 12 to line 16, column 18 in eval_error_in_invariant_form
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

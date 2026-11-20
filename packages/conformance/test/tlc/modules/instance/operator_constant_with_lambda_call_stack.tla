(*---
description: "An operator constant set to a LAMBDA puts only the application and the LAMBDA's body on the call stack."
ref: "tlc2/tool/impl/Tool.java#evalAppl"
features: [instance]
config: |
  INIT Init
  NEXT Next
outcome: evaluation-failure
---*)
---- MODULE operator_constant_with_lambda_call_stack ----
EXTENDS Naturals
---- MODULE I ----
EXTENDS Naturals
CONSTANT F(_)
VARIABLE x
Val == {F(4)}
====
VARIABLE x
M == INSTANCE I WITH F <- LAMBDA y : y + "a"
Init == x = 0
Next == x' = M!Val
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 21, column 9 to line 21, column 18 in operator_constant_with_lambda_call_stack
    1. Line 21, column 14 to line 21, column 18 in operator_constant_with_lambda_call_stack
    2. Line 19, column 1 to line 19, column 44 in operator_constant_with_lambda_call_stack
    3. Line 16, column 8 to line 16, column 13 in operator_constant_with_lambda_call_stack
    4. Line 16, column 9 to line 16, column 12 in operator_constant_with_lambda_call_stack
    5. Line 19, column 38 to line 19, column 44 in operator_constant_with_lambda_call_stack
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

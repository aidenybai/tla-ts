(*---
description: "A LET INSTANCE with substitutions puts the instance on the call stack once, where its name reaches a definition."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
includes: [FixCall.tla]
config: |
  INIT Init
  NEXT Next
outcome: evaluation-failure
---*)
---- MODULE let_instance_with_call_stack ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = LET L == INSTANCE FixCall WITH c <- TRUE IN L!G(1)
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
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 63 in let_instance_with_call_stack
    1. Line 15, column 14 to line 15, column 63 in let_instance_with_call_stack
    2. Line 15, column 58 to line 15, column 63 in let_instance_with_call_stack
    3. Line 15, column 18 to line 15, column 53 in let_instance_with_call_stack
    4. Line 5, column 9 to line 5, column 16 in FixCall
    5. Line 5, column 9 to line 5, column 12 in FixCall
    6. Line 4, column 9 to line 4, column 13 in FixCall
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

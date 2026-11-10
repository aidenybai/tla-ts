(*---
description: TLCGet of a set fails with the argument error.
ref: tlc2/module/TLCGetSet.java#TLCGet
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE get_set_argument ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3 /\ PrintT(TLCGet({1}))
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
    public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    {1}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 47 in get_set_argument
    1. Line 13, column 9 to line 13, column 24 in get_set_argument
    2. Line 13, column 29 to line 13, column 47 in get_set_argument
    3. Line 13, column 36 to line 13, column 46 in get_set_argument
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

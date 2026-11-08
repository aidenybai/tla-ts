(*---
description: TLCExt.tla promises TRUE in Next before the successor is determined, but fingerprinting the partial state throws a NullPointerException first. Real TLC bug.
ref: tlc2/module/TLCExt.java#pickSuccessor
features:
  - TLCExt
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE pick_in_next_unassigned ----
EXTENDS TLCExt, TLC, Naturals
VARIABLE x
Init == x = 0
Next == /\ PickSuccessor(x' = 99)
        /\ x' = 0
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
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 17, column 17 in pick_in_next_unassigned
    1. Line 16, column 12 to line 16, column 33 in pick_in_next_unassigned
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

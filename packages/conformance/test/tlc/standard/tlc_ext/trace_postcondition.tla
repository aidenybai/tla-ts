(*---
description: Trace in a POSTCONDITION fails, since the state it evaluates in has its variables undefined.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE trace_postcondition ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == PrintT(Trace)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2405:1 Evaluating postcondition Post at line 17, col 9 to line 17, col 21 of module trace_postcondition failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.TupleValue tlc2.module.TLCExt.getTrace(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel) throws java.io.IOException,
    but it produced the following error:
    1000:0 In evaluating TLCExt!Trace, the state is not completely specified yet (variable x undefined).
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

(*---
description: Trace in Init before a variable is assigned fails, naming the variable.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE trace_init_before_assignment ----
EXTENDS TLCExt, TLC, Sequences
VARIABLE x
Init == Trace = <<>> /\ x = 0
Next == UNCHANGED x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.TupleValue tlc2.module.TLCExt.getTrace(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel) throws java.io.IOException,
    but it produced the following error:
    1000:0 In evaluating TLCExt!Trace, the state is not completely specified yet (variable x undefined).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 29 in trace_init_before_assignment
    1. Line 14, column 9 to line 14, column 20 in trace_init_before_assignment
    2. Line 14, column 9 to line 14, column 13 in trace_init_before_assignment
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

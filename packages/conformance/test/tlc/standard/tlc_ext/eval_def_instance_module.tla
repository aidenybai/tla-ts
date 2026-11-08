(*---
description: An operator from a nested module is not in the root module's table.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE eval_def_instance_module ----
EXTENDS TLCExt, TLC
VARIABLE x
---- MODULE Nested ----
Inner == 1
====
N == INSTANCE Nested
Init == x = 0 /\ TLCEvalDefinition("Inner") = 1
Next == UNCHANGED x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcDefByName(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Inner"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 47 in eval_def_instance_module
    1. Line 18, column 9 to line 18, column 13 in eval_def_instance_module
    2. Line 18, column 18 to line 18, column 47 in eval_def_instance_module
    3. Line 18, column 18 to line 18, column 43 in eval_def_instance_module
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

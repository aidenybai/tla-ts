(*---
description: An error in the closure propagates.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cache_closure_error ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCCache(1, 1 \div 0) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module cache_closure_error failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcEval2(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcEval2(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cache_closure_error
    1. Line 14, column 29 to line 14, column 32 in cache_closure_error
    2. Line 12, column 9 to line 12, column 33 in cache_closure_error
    3. Line 12, column 9 to line 12, column 29 in cache_closure_error
    4. Line 12, column 21 to line 12, column 28 in cache_closure_error
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcEval2(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in cache_closure_error
    1. Line 15, column 30 to line 15, column 33 in cache_closure_error
    2. Line 12, column 9 to line 12, column 33 in cache_closure_error
    3. Line 12, column 9 to line 12, column 29 in cache_closure_error
    4. Line 12, column 21 to line 12, column 28 in cache_closure_error
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcEval2(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cache_closure_error
    1. Line 16, column 8 to line 16, column 32 in cache_closure_error
    2. Line 16, column 29 to line 16, column 32 in cache_closure_error
    3. Line 12, column 9 to line 12, column 33 in cache_closure_error
    4. Line 12, column 9 to line 12, column 29 in cache_closure_error
    5. Line 12, column 21 to line 12, column 28 in cache_closure_error
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLCExt.tlcEval2(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cache_closure_error
    1. Line 15, column 12 to line 15, column 36 in cache_closure_error
    2. Line 15, column 33 to line 15, column 36 in cache_closure_error
    3. Line 12, column 9 to line 12, column 33 in cache_closure_error
    4. Line 12, column 9 to line 12, column 29 in cache_closure_error
    5. Line 12, column 21 to line 12, column 28 in cache_closure_error
---*)

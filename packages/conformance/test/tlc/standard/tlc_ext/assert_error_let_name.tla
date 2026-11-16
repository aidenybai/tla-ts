(*---
description: A LET name is not a literal either.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE assert_error_let_name ----
EXTENDS TLCExt, TLC, Naturals
Test == LET m == "a" IN AssertError(m, 1)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module assert_error_let_name failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.assertError(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    In computing AssertError, a non-string expression (line 12, col 37 to line 12, col 37 of module assert_error_let_name) was used as the err of an AssertError(err, exp).
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.assertError(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    In computing AssertError, a non-string expression (line 12, col 37 to line 12, col 37 of module assert_error_let_name) was used as the err of an AssertError(err, exp).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_error_let_name
    1. Line 14, column 29 to line 14, column 32 in assert_error_let_name
    2. Line 12, column 9 to line 12, column 41 in assert_error_let_name
    3. Line 12, column 25 to line 12, column 41 in assert_error_let_name
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.assertError(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    In computing AssertError, a non-string expression (line 12, col 37 to line 12, col 37 of module assert_error_let_name) was used as the err of an AssertError(err, exp).
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in assert_error_let_name
    1. Line 15, column 30 to line 15, column 33 in assert_error_let_name
    2. Line 12, column 9 to line 12, column 41 in assert_error_let_name
    3. Line 12, column 25 to line 12, column 41 in assert_error_let_name
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.assertError(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    In computing AssertError, a non-string expression (line 12, col 37 to line 12, col 37 of module assert_error_let_name) was used as the err of an AssertError(err, exp).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_error_let_name
    1. Line 16, column 8 to line 16, column 32 in assert_error_let_name
    2. Line 16, column 29 to line 16, column 32 in assert_error_let_name
    3. Line 12, column 9 to line 12, column 41 in assert_error_let_name
    4. Line 12, column 25 to line 12, column 41 in assert_error_let_name
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.assertError(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    In computing AssertError, a non-string expression (line 12, col 37 to line 12, col 37 of module assert_error_let_name) was used as the err of an AssertError(err, exp).
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in assert_error_let_name
    1. Line 15, column 12 to line 15, column 36 in assert_error_let_name
    2. Line 15, column 33 to line 15, column 36 in assert_error_let_name
    3. Line 12, column 9 to line 12, column 41 in assert_error_let_name
    4. Line 12, column 25 to line 12, column 41 in assert_error_let_name
---*)

(*---
description: TLCExt.tla promises TRUE at state level, but the fingerprint of the unset next state throws a NullPointerException first. Real TLC bug.
ref: tlc2/module/TLCExt.java#pickSuccessor
features:
  - TLCExt
  - tlc-bug
flags:
  - expression
contexts:
  - init
  - next
  - invariant
  - property
outcome: evaluation-failure
---*)
---- MODULE pick_state_level_null_fingerprint ----
EXTENDS TLCExt, TLC, Naturals
Test == PickSuccessor(TRUE)
====

(*--- recorded
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 20, column 9 to line 20, column 32 in pick_state_level_null_fingerprint
    1. Line 20, column 29 to line 20, column 32 in pick_state_level_null_fingerprint
    2. Line 18, column 9 to line 18, column 27 in pick_state_level_null_fingerprint
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 21, column 9 to line 21, column 33 in pick_state_level_null_fingerprint
    1. Line 21, column 30 to line 21, column 33 in pick_state_level_null_fingerprint
    2. Line 18, column 9 to line 18, column 27 in pick_state_level_null_fingerprint
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.TLCExt.pickSuccessor(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    Cannot invoke "tlc2.value.IValue.fingerPrint(long)" because "minVals[i]" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 20, column 9 to line 20, column 32 in pick_state_level_null_fingerprint
    1. Line 22, column 8 to line 22, column 32 in pick_state_level_null_fingerprint
    2. Line 22, column 29 to line 22, column 32 in pick_state_level_null_fingerprint
    3. Line 18, column 9 to line 18, column 27 in pick_state_level_null_fingerprint
property:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)

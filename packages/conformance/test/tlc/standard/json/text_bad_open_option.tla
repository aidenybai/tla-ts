(*---
description: An unknown open option fails with Java's exception.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - IOUtils.tla
---*)
---- MODULE text_bad_open_option ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == Serialize(<<1>>, "out", [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"NOPE">>])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module text_bad_open_option failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.NOPE
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.NOPE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_bad_open_option
    1. Line 16, column 29 to line 16, column 32 in text_bad_open_option
    2. Line 14, column 9 to line 14, column 103 in text_bad_open_option
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.NOPE
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in text_bad_open_option
    1. Line 17, column 30 to line 17, column 33 in text_bad_open_option
    2. Line 14, column 9 to line 14, column 103 in text_bad_open_option
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.NOPE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_bad_open_option
    1. Line 18, column 8 to line 18, column 32 in text_bad_open_option
    2. Line 18, column 29 to line 18, column 32 in text_bad_open_option
    3. Line 14, column 9 to line 14, column 103 in text_bad_open_option
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    java.lang.IllegalArgumentException: No enum constant java.nio.file.StandardOpenOption.NOPE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_bad_open_option
    1. Line 17, column 12 to line 17, column 36 in text_bad_open_option
    2. Line 17, column 33 to line 17, column 36 in text_bad_open_option
    3. Line 14, column 9 to line 14, column 103 in text_bad_open_option
---*)

(*---
description: A non-string format fails the Java cast.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - IOUtils.tla
---*)
---- MODULE text_format_not_string ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == Serialize(<<1>>, "out", [format |-> 1])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_format_not_string
    1. Line 16, column 29 to line 16, column 32 in text_format_not_string
    2. Line 14, column 9 to line 14, column 47 in text_format_not_string
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in text_format_not_string
    1. Line 17, column 30 to line 17, column 33 in text_format_not_string
    2. Line 14, column 9 to line 14, column 47 in text_format_not_string
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_format_not_string
    1. Line 18, column 8 to line 18, column 32 in text_format_not_string
    2. Line 18, column 29 to line 18, column 32 in text_format_not_string
    3. Line 14, column 9 to line 14, column 47 in text_format_not_string
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.Value tlc2.module.Json.textSerialize(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),
    but it produced the following error:
    class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_format_not_string
    1. Line 17, column 12 to line 17, column 36 in text_format_not_string
    2. Line 17, column 33 to line 17, column 36 in text_format_not_string
    3. Line 14, column 9 to line 14, column 47 in text_format_not_string
---*)

(*---
description: A null line is rejected by name.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - fixtures/null.ndjson
---*)
---- MODULE nd_null_line ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("fixtures/null.ndjson") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in nd_null_line
    1. Line 16, column 29 to line 16, column 32 in nd_null_line
    2. Line 14, column 9 to line 14, column 53 in nd_null_line
    3. Line 14, column 9 to line 14, column 49 in nd_null_line
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in nd_null_line
    1. Line 17, column 30 to line 17, column 33 in nd_null_line
    2. Line 14, column 9 to line 14, column 53 in nd_null_line
    3. Line 14, column 9 to line 14, column 49 in nd_null_line
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in nd_null_line
    1. Line 18, column 8 to line 18, column 32 in nd_null_line
    2. Line 18, column 29 to line 18, column 32 in nd_null_line
    3. Line 14, column 9 to line 14, column 53 in nd_null_line
    4. Line 14, column 9 to line 14, column 49 in nd_null_line
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in nd_null_line
    1. Line 17, column 12 to line 17, column 36 in nd_null_line
    2. Line 17, column 33 to line 17, column 36 in nd_null_line
    3. Line 14, column 9 to line 14, column 53 in nd_null_line
    4. Line 14, column 9 to line 14, column 49 in nd_null_line
---*)

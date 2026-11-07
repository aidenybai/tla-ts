(*---
description: A string is no array.
ref: tlc2/module/Json.java#getArrayNode
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE array_string ----
EXTENDS Json, TLC, Naturals
Test == ToJsonArray("a") = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in array_string
    1. Line 14, column 29 to line 14, column 32 in array_string
    2. Line 12, column 9 to line 12, column 29 in array_string
    3. Line 12, column 9 to line 12, column 24 in array_string
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in array_string
    1. Line 15, column 30 to line 15, column 33 in array_string
    2. Line 12, column 9 to line 12, column 29 in array_string
    3. Line 12, column 9 to line 12, column 24 in array_string
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in array_string
    1. Line 16, column 8 to line 16, column 32 in array_string
    2. Line 16, column 29 to line 16, column 32 in array_string
    3. Line 12, column 9 to line 12, column 29 in array_string
    4. Line 12, column 9 to line 12, column 24 in array_string
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonArray(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in array_string
    1. Line 15, column 12 to line 15, column 36 in array_string
    2. Line 15, column 33 to line 15, column 36 in array_string
    3. Line 12, column 9 to line 12, column 29 in array_string
    4. Line 12, column 9 to line 12, column 24 in array_string
---*)

(*---
description: A non-string path fails the cast.
ref: tlc2/module/Json.java#ndSerialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nd_se_non_string_path ----
EXTENDS Json, TLC, Naturals
Test == ndJsonSerialize(1, <<1>>)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_se_non_string_path
    1. Line 14, column 29 to line 14, column 32 in nd_se_non_string_path
    2. Line 12, column 9 to line 12, column 33 in nd_se_non_string_path
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nd_se_non_string_path
    1. Line 15, column 30 to line 15, column 33 in nd_se_non_string_path
    2. Line 12, column 9 to line 12, column 33 in nd_se_non_string_path
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_se_non_string_path
    1. Line 16, column 8 to line 16, column 32 in nd_se_non_string_path
    2. Line 16, column 29 to line 16, column 32 in nd_se_non_string_path
    3. Line 12, column 9 to line 12, column 33 in nd_se_non_string_path
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.ndSerialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntValue to tlc2.value.impl.StringValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_se_non_string_path
    1. Line 15, column 12 to line 15, column 36 in nd_se_non_string_path
    2. Line 15, column 33 to line 15, column 36 in nd_se_non_string_path
    3. Line 12, column 9 to line 12, column 33 in nd_se_non_string_path
---*)

(*---
description: A set is no object.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE object_set ----
EXTENDS Json, TLC, Naturals
Test == ToJsonObject({1}) = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in object_set
    1. Line 14, column 29 to line 14, column 32 in object_set
    2. Line 12, column 9 to line 12, column 30 in object_set
    3. Line 12, column 9 to line 12, column 25 in object_set
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in object_set
    1. Line 15, column 30 to line 15, column 33 in object_set
    2. Line 12, column 9 to line 12, column 30 in object_set
    3. Line 12, column 9 to line 12, column 25 in object_set
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in object_set
    1. Line 16, column 8 to line 16, column 32 in object_set
    2. Line 16, column 29 to line 16, column 32 in object_set
    3. Line 12, column 9 to line 12, column 30 in object_set
    4. Line 12, column 9 to line 12, column 25 in object_set
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJsonObject(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.SetEnumValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in object_set
    1. Line 15, column 12 to line 15, column 36 in object_set
    2. Line 15, column 33 to line 15, column 36 in object_set
    3. Line 12, column 9 to line 12, column 30 in object_set
    4. Line 12, column 9 to line 12, column 25 in object_set
---*)

(*---
description: A float is rejected with its literal.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - fixtures/float.json
---*)
---- MODULE de_float ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/float.json") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float
    1. Line 16, column 29 to line 16, column 32 in de_float
    2. Line 14, column 9 to line 14, column 50 in de_float
    3. Line 14, column 9 to line 14, column 46 in de_float
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in de_float
    1. Line 17, column 30 to line 17, column 33 in de_float
    2. Line 14, column 9 to line 14, column 50 in de_float
    3. Line 14, column 9 to line 14, column 46 in de_float
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float
    1. Line 18, column 8 to line 18, column 32 in de_float
    2. Line 18, column 29 to line 18, column 32 in de_float
    3. Line 14, column 9 to line 14, column 50 in de_float
    4. Line 14, column 9 to line 14, column 46 in de_float
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float
    1. Line 17, column 12 to line 17, column 36 in de_float
    2. Line 17, column 33 to line 17, column 36 in de_float
    3. Line 14, column 9 to line 14, column 50 in de_float
    4. Line 14, column 9 to line 14, column 46 in de_float
---*)

(*---
description: "1.0 is rejected too: the literal does not parse as an int."
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - fixtures/float_whole.json
---*)
---- MODULE de_float_whole ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/float_whole.json") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float_whole
    1. Line 16, column 29 to line 16, column 32 in de_float_whole
    2. Line 14, column 9 to line 14, column 56 in de_float_whole
    3. Line 14, column 9 to line 14, column 52 in de_float_whole
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
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in de_float_whole
    1. Line 17, column 30 to line 17, column 33 in de_float_whole
    2. Line 14, column 9 to line 14, column 56 in de_float_whole
    3. Line 14, column 9 to line 14, column 52 in de_float_whole
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float_whole
    1. Line 18, column 8 to line 18, column 32 in de_float_whole
    2. Line 18, column 29 to line 18, column 32 in de_float_whole
    3. Line 14, column 9 to line 14, column 56 in de_float_whole
    4. Line 14, column 9 to line 14, column 52 in de_float_whole
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: expected a 32-bit integer JSON number, but found 1.0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_float_whole
    1. Line 17, column 12 to line 17, column 36 in de_float_whole
    2. Line 17, column 33 to line 17, column 36 in de_float_whole
    3. Line 14, column 9 to line 14, column 56 in de_float_whole
    4. Line 14, column 9 to line 14, column 52 in de_float_whole
---*)

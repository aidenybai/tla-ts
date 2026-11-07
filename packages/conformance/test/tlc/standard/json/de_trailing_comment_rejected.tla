(*---
description: Gson checks the end of the document strictly, so a comment after the value fails.
ref: tlc2/module/Json.java#deserialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - fixtures/trailing_comment.json
---*)
---- MODULE de_trailing_comment_rejected ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/trailing_comment.json") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_trailing_comment_rejected
    1. Line 16, column 29 to line 16, column 32 in de_trailing_comment_rejected
    2. Line 14, column 9 to line 14, column 61 in de_trailing_comment_rejected
    3. Line 14, column 9 to line 14, column 57 in de_trailing_comment_rejected
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
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in de_trailing_comment_rejected
    1. Line 17, column 30 to line 17, column 33 in de_trailing_comment_rejected
    2. Line 14, column 9 to line 14, column 61 in de_trailing_comment_rejected
    3. Line 14, column 9 to line 14, column 57 in de_trailing_comment_rejected
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_trailing_comment_rejected
    1. Line 18, column 8 to line 18, column 32 in de_trailing_comment_rejected
    2. Line 18, column 29 to line 18, column 32 in de_trailing_comment_rejected
    3. Line 14, column 9 to line 14, column 61 in de_trailing_comment_rejected
    4. Line 14, column 9 to line 14, column 57 in de_trailing_comment_rejected
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    com.google.gson.stream.MalformedJsonException: Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON at line 1 column 4 path $
    See https://github.com/google/gson/blob/main/Troubleshooting.md#malformed-json
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_trailing_comment_rejected
    1. Line 17, column 12 to line 17, column 36 in de_trailing_comment_rejected
    2. Line 17, column 33 to line 17, column 36 in de_trailing_comment_rejected
    3. Line 14, column 9 to line 14, column 61 in de_trailing_comment_rejected
    4. Line 14, column 9 to line 14, column 57 in de_trailing_comment_rejected
---*)

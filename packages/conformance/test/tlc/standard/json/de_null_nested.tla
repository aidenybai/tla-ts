(*---
description: A nested null is rejected by name.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - fixtures/null_nested.json
---*)
---- MODULE de_null_nested ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/null_nested.json") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module de_null_nested failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_null_nested
    1. Line 16, column 29 to line 16, column 32 in de_null_nested
    2. Line 14, column 9 to line 14, column 56 in de_null_nested
    3. Line 14, column 9 to line 14, column 52 in de_null_nested
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in de_null_nested
    1. Line 17, column 30 to line 17, column 33 in de_null_nested
    2. Line 14, column 9 to line 14, column 56 in de_null_nested
    3. Line 14, column 9 to line 14, column 52 in de_null_nested
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_null_nested
    1. Line 18, column 8 to line 18, column 32 in de_null_nested
    2. Line 18, column 29 to line 18, column 32 in de_null_nested
    3. Line 14, column 9 to line 14, column 56 in de_null_nested
    4. Line 14, column 9 to line 14, column 52 in de_null_nested
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported JSON value null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in de_null_nested
    1. Line 17, column 12 to line 17, column 36 in de_null_nested
    2. Line 17, column 33 to line 17, column 36 in de_null_nested
    3. Line 14, column 9 to line 14, column 56 in de_null_nested
    4. Line 14, column 9 to line 14, column 52 in de_null_nested
---*)

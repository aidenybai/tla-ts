(*---
description: An unsupported value inside fails after the file opens.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE se_unserializable_inner ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", <<Nat>>)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module se_unserializable_inner failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_unserializable_inner
    1. Line 14, column 29 to line 14, column 32 in se_unserializable_inner
    2. Line 12, column 9 to line 12, column 42 in se_unserializable_inner
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in se_unserializable_inner
    1. Line 15, column 30 to line 15, column 33 in se_unserializable_inner
    2. Line 12, column 9 to line 12, column 42 in se_unserializable_inner
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_unserializable_inner
    1. Line 16, column 8 to line 16, column 32 in se_unserializable_inner
    2. Line 16, column 29 to line 16, column 32 in se_unserializable_inner
    3. Line 12, column 9 to line 12, column 42 in se_unserializable_inner
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_unserializable_inner
    1. Line 15, column 12 to line 15, column 36 in se_unserializable_inner
    2. Line 15, column 33 to line 15, column 36 in se_unserializable_inner
    3. Line 12, column 9 to line 12, column 42 in se_unserializable_inner
---*)

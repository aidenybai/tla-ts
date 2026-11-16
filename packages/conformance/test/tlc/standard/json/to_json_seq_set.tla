(*---
description: Seq has no JSON form.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE to_json_seq_set ----
EXTENDS Json, TLC, Naturals, Sequences
Test == ToJson(Seq({1})) = ""
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module to_json_seq_set failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_json_seq_set
    1. Line 14, column 29 to line 14, column 32 in to_json_seq_set
    2. Line 12, column 9 to line 12, column 29 in to_json_seq_set
    3. Line 12, column 9 to line 12, column 24 in to_json_seq_set
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in to_json_seq_set
    1. Line 15, column 30 to line 15, column 33 in to_json_seq_set
    2. Line 12, column 9 to line 12, column 29 in to_json_seq_set
    3. Line 12, column 9 to line 12, column 24 in to_json_seq_set
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_json_seq_set
    1. Line 16, column 8 to line 16, column 32 in to_json_seq_set
    2. Line 16, column 29 to line 16, column 32 in to_json_seq_set
    3. Line 12, column 9 to line 12, column 29 in to_json_seq_set
    4. Line 12, column 9 to line 12, column 24 in to_json_seq_set
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException,
    but it produced the following error:
    Cannot convert value: unsupported value type tlc2.value.impl.UserValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_json_seq_set
    1. Line 15, column 12 to line 15, column 36 in to_json_seq_set
    2. Line 15, column 33 to line 15, column 36 in to_json_seq_set
    3. Line 12, column 9 to line 12, column 29 in to_json_seq_set
    4. Line 12, column 9 to line 12, column 24 in to_json_seq_set
---*)

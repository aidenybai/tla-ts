(*---
description: Writing to a directory fails in the file writer.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE se_directory_target ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize(".", <<1>>)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module se_directory_target failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    . (Is a directory)
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    . (Is a directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_directory_target
    1. Line 14, column 29 to line 14, column 32 in se_directory_target
    2. Line 12, column 9 to line 12, column 33 in se_directory_target
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
    . (Is a directory)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in se_directory_target
    1. Line 15, column 30 to line 15, column 33 in se_directory_target
    2. Line 12, column 9 to line 12, column 33 in se_directory_target
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    . (Is a directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_directory_target
    1. Line 16, column 8 to line 16, column 32 in se_directory_target
    2. Line 16, column 29 to line 16, column 32 in se_directory_target
    3. Line 12, column 9 to line 12, column 33 in se_directory_target
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static synchronized tlc2.value.impl.BoolValue tlc2.module.Json.serialize(tlc2.value.impl.StringValue,tlc2.value.impl.Value) throws java.io.IOException,
    but it produced the following error:
    . (Is a directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_directory_target
    1. Line 15, column 12 to line 15, column 36 in se_directory_target
    2. Line 15, column 33 to line 15, column 36 in se_directory_target
    3. Line 12, column 9 to line 12, column 33 in se_directory_target
---*)

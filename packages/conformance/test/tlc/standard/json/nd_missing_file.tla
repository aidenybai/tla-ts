(*---
description: A missing file is reported with its relative path.
ref: tlc2/module/Json.java#ndDeserialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nd_missing_file ----
EXTENDS Json, TLC, Naturals
Test == ndJsonDeserialize("no_such_file.ndjson") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_missing_file
    1. Line 14, column 29 to line 14, column 32 in nd_missing_file
    2. Line 12, column 9 to line 12, column 52 in nd_missing_file
    3. Line 12, column 9 to line 12, column 48 in nd_missing_file
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nd_missing_file
    1. Line 15, column 30 to line 15, column 33 in nd_missing_file
    2. Line 12, column 9 to line 12, column 52 in nd_missing_file
    3. Line 12, column 9 to line 12, column 48 in nd_missing_file
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_missing_file
    1. Line 16, column 8 to line 16, column 32 in nd_missing_file
    2. Line 16, column 29 to line 16, column 32 in nd_missing_file
    3. Line 12, column 9 to line 12, column 52 in nd_missing_file
    4. Line 12, column 9 to line 12, column 48 in nd_missing_file
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IValue tlc2.module.Json.ndDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,
    but it produced the following error:
    no_such_file.ndjson (No such file or directory)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nd_missing_file
    1. Line 15, column 12 to line 15, column 36 in nd_missing_file
    2. Line 15, column 33 to line 15, column 36 in nd_missing_file
    3. Line 12, column 9 to line 12, column 52 in nd_missing_file
    4. Line 12, column 9 to line 12, column 48 in nd_missing_file
---*)

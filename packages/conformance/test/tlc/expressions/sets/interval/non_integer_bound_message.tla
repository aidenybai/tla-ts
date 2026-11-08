(*---
description: "A non-integer interval bound reports an argument error naming the operator."
ref: "tlc2/module/Naturals.java#DotDot"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE non_integer_bound_message ----
EXTENDS Integers
Test == ("a"..2) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module non_integer_bound_message failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_integer_bound_message
    1. Line 11, column 29 to line 11, column 32 in non_integer_bound_message
    2. Line 9, column 9 to line 9, column 21 in non_integer_bound_message
    3. Line 9, column 10 to line 9, column 15 in non_integer_bound_message
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in non_integer_bound_message
    1. Line 12, column 30 to line 12, column 33 in non_integer_bound_message
    2. Line 9, column 9 to line 9, column 21 in non_integer_bound_message
    3. Line 9, column 10 to line 9, column 15 in non_integer_bound_message
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_integer_bound_message
    1. Line 13, column 8 to line 13, column 32 in non_integer_bound_message
    2. Line 13, column 29 to line 13, column 32 in non_integer_bound_message
    3. Line 9, column 9 to line 9, column 21 in non_integer_bound_message
    4. Line 9, column 10 to line 9, column 15 in non_integer_bound_message
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in non_integer_bound_message
    1. Line 12, column 12 to line 12, column 36 in non_integer_bound_message
    2. Line 12, column 33 to line 12, column 36 in non_integer_bound_message
    3. Line 9, column 9 to line 9, column 21 in non_integer_bound_message
    4. Line 9, column 10 to line 9, column 15 in non_integer_bound_message
---*)

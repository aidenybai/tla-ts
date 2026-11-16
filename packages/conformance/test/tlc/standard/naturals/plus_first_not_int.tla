(*---
description: Plus takes IntValue parameters, so a string first operand fails the Java cast.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE plus_first_not_int ----
EXTENDS Naturals
Test == "a" + 1 = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module plus_first_not_int failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_first_not_int
    1. Line 14, column 29 to line 14, column 32 in plus_first_not_int
    2. Line 12, column 9 to line 12, column 19 in plus_first_not_int
    3. Line 12, column 9 to line 12, column 15 in plus_first_not_int
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in plus_first_not_int
    1. Line 15, column 30 to line 15, column 33 in plus_first_not_int
    2. Line 12, column 9 to line 12, column 19 in plus_first_not_int
    3. Line 12, column 9 to line 12, column 15 in plus_first_not_int
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_first_not_int
    1. Line 16, column 8 to line 16, column 32 in plus_first_not_int
    2. Line 16, column 29 to line 16, column 32 in plus_first_not_int
    3. Line 12, column 9 to line 12, column 19 in plus_first_not_int
    4. Line 12, column 9 to line 12, column 15 in plus_first_not_int
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_first_not_int
    1. Line 15, column 12 to line 15, column 36 in plus_first_not_int
    2. Line 15, column 33 to line 15, column 36 in plus_first_not_int
    3. Line 12, column 9 to line 12, column 19 in plus_first_not_int
    4. Line 12, column 9 to line 12, column 15 in plus_first_not_int
---*)

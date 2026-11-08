(*---
description: Looking up a string among integer keys fails in the comparison.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE bag_in_incomparable_key ----
EXTENDS Bags, TLC, Naturals
Test == BagIn("a", 1 :> 1)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module bag_in_incomparable_key failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_incomparable_key
    1. Line 14, column 29 to line 14, column 32 in bag_in_incomparable_key
    2. Line 12, column 9 to line 12, column 26 in bag_in_incomparable_key
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in bag_in_incomparable_key
    1. Line 15, column 30 to line 15, column 33 in bag_in_incomparable_key
    2. Line 12, column 9 to line 12, column 26 in bag_in_incomparable_key
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_incomparable_key
    1. Line 16, column 8 to line 16, column 32 in bag_in_incomparable_key
    2. Line 16, column 29 to line 16, column 32 in bag_in_incomparable_key
    3. Line 12, column 9 to line 12, column 26 in bag_in_incomparable_key
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_in_incomparable_key
    1. Line 15, column 12 to line 15, column 36 in bag_in_incomparable_key
    2. Line 15, column 33 to line 15, column 36 in bag_in_incomparable_key
    3. Line 12, column 9 to line 12, column 26 in bag_in_incomparable_key
---*)

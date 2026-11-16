(*---
description: A function over Nat cannot convert to an enumerated function.
ref: tlc2/value/impl/FcnLambdaValue.java#toFcnRcd
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE is_a_bag_infinite_function ----
EXTENDS Bags, TLC, Naturals
Test == IsABag([n \in Nat |-> 1])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module is_a_bag_infinite_function failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.IsABag(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.IsABag(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_a_bag_infinite_function
    1. Line 14, column 29 to line 14, column 32 in is_a_bag_infinite_function
    2. Line 12, column 9 to line 12, column 33 in is_a_bag_infinite_function
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.IsABag(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in is_a_bag_infinite_function
    1. Line 15, column 30 to line 15, column 33 in is_a_bag_infinite_function
    2. Line 12, column 9 to line 12, column 33 in is_a_bag_infinite_function
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.IsABag(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_a_bag_infinite_function
    1. Line 16, column 8 to line 16, column 32 in is_a_bag_infinite_function
    2. Line 16, column 29 to line 16, column 32 in is_a_bag_infinite_function
    3. Line 12, column 9 to line 12, column 33 in is_a_bag_infinite_function
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.IsABag(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_a_bag_infinite_function
    1. Line 15, column 12 to line 15, column 36 in is_a_bag_infinite_function
    2. Line 15, column 33 to line 15, column 36 in is_a_bag_infinite_function
    3. Line 12, column 9 to line 12, column 33 in is_a_bag_infinite_function
---*)

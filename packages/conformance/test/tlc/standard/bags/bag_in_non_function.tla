(*---
description: "BagIn dereferences a null conversion, so a non-function gives a NullPointerException wrapped by MethodValue instead of an argument error. Real TLC bug: the source lacks the null check its siblings have."
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 69, col 8 to line 69, col 11 of module bag_in_non_function failed.
      2169:0 The second argument of BagIn should be a bag, but instead it is:
      3
  init:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagIn should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in bag_in_non_function
      1. Line 70, column 29 to line 70, column 32 in bag_in_non_function
      2. Line 68, column 9 to line 68, column 19 in bag_in_non_function
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagIn should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in bag_in_non_function
      1. Line 72, column 8 to line 72, column 32 in bag_in_non_function
      2. Line 72, column 29 to line 72, column 32 in bag_in_non_function
      3. Line 68, column 9 to line 68, column 19 in bag_in_non_function
  next:
    exit: 255
    transcript: |-
      2169:1 The second argument of BagIn should be a bag, but instead it is:
      3
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 71, column 9 to line 71, column 33 in bag_in_non_function
      1. Line 71, column 30 to line 71, column 33 in bag_in_non_function
      2. Line 68, column 9 to line 68, column 19 in bag_in_non_function
  property:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of BagIn should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 32 in bag_in_non_function
      1. Line 71, column 12 to line 71, column 36 in bag_in_non_function
      2. Line 71, column 33 to line 71, column 36 in bag_in_non_function
      3. Line 68, column 9 to line 68, column 19 in bag_in_non_function
---*)
---- MODULE bag_in_non_function ----
EXTENDS Bags, TLC, Naturals
Test == BagIn(1, 3)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 14, col 8 to line 14, col 11 of module bag_in_non_function failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in bag_in_non_function
    1. Line 15, column 29 to line 15, column 32 in bag_in_non_function
    2. Line 13, column 9 to line 13, column 19 in bag_in_non_function
next:
  exit: 255
  transcript: |-
    2154:1 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in bag_in_non_function
    1. Line 16, column 30 to line 16, column 33 in bag_in_non_function
    2. Line 13, column 9 to line 13, column 19 in bag_in_non_function
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in bag_in_non_function
    1. Line 17, column 8 to line 17, column 32 in bag_in_non_function
    2. Line 17, column 29 to line 17, column 32 in bag_in_non_function
    3. Line 13, column 9 to line 13, column 19 in bag_in_non_function
property:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in bag_in_non_function
    1. Line 16, column 12 to line 16, column 36 in bag_in_non_function
    2. Line 16, column 33 to line 16, column 36 in bag_in_non_function
    3. Line 13, column 9 to line 13, column 19 in bag_in_non_function
---*)

(*---
description: "A non-function gives a NullPointerException, because the check calls IsABag on the null conversion. Real TLC bug: the intended argument error is unreachable."
ref: tlc2/module/Bags.java#BagCup
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
      2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module cup_first_non_function failed.
      2169:0 The first argument of (+) should be a bag, but instead it is:
      3
  init:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The first argument of (+) should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
      1. Line 74, column 29 to line 74, column 32 in cup_first_non_function
      2. Line 72, column 9 to line 72, column 33 in cup_first_non_function
      3. Line 72, column 9 to line 72, column 22 in cup_first_non_function
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The first argument of (+) should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
      1. Line 76, column 8 to line 76, column 32 in cup_first_non_function
      2. Line 76, column 29 to line 76, column 32 in cup_first_non_function
      3. Line 72, column 9 to line 72, column 33 in cup_first_non_function
      4. Line 72, column 9 to line 72, column 22 in cup_first_non_function
  next:
    exit: 255
    transcript: |-
      2169:1 The first argument of (+) should be a bag, but instead it is:
      3
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 33 in cup_first_non_function
      1. Line 75, column 30 to line 75, column 33 in cup_first_non_function
      2. Line 72, column 9 to line 72, column 33 in cup_first_non_function
      3. Line 72, column 9 to line 72, column 22 in cup_first_non_function
  property:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The first argument of (+) should be a bag, but instead it is:
      3
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
      1. Line 75, column 12 to line 75, column 36 in cup_first_non_function
      2. Line 75, column 33 to line 75, column 36 in cup_first_non_function
      3. Line 72, column 9 to line 72, column 33 in cup_first_non_function
      4. Line 72, column 9 to line 72, column 22 in cup_first_non_function
---*)
---- MODULE cup_first_non_function ----
EXTENDS Bags, TLC, Naturals
Test == 3 (+) EmptyBag = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module cup_first_non_function failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
    1. Line 74, column 29 to line 74, column 32 in cup_first_non_function
    2. Line 72, column 9 to line 72, column 33 in cup_first_non_function
    3. Line 72, column 9 to line 72, column 22 in cup_first_non_function
next:
  exit: 255
  transcript: |-
    2154:1 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 75, column 9 to line 75, column 33 in cup_first_non_function
    1. Line 75, column 30 to line 75, column 33 in cup_first_non_function
    2. Line 72, column 9 to line 72, column 33 in cup_first_non_function
    3. Line 72, column 9 to line 72, column 22 in cup_first_non_function
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
    1. Line 76, column 8 to line 76, column 32 in cup_first_non_function
    2. Line 76, column 29 to line 76, column 32 in cup_first_non_function
    3. Line 72, column 9 to line 72, column 33 in cup_first_non_function
    4. Line 72, column 9 to line 72, column 22 in cup_first_non_function
property:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in cup_first_non_function
    1. Line 75, column 12 to line 75, column 36 in cup_first_non_function
    2. Line 75, column 33 to line 75, column 36 in cup_first_non_function
    3. Line 72, column 9 to line 72, column 33 in cup_first_non_function
    4. Line 72, column 9 to line 72, column 22 in cup_first_non_function
---*)

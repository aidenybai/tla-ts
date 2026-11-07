(*---
description: "A non-function gives a NullPointerException, because the check calls IsABag on the null conversion. Real TLC bug: the intended argument error is unreachable."
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cup_first_non_function ----
EXTENDS Bags, TLC, Naturals
Test == 3 (+) EmptyBag = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in cup_first_non_function
    1. Line 15, column 29 to line 15, column 32 in cup_first_non_function
    2. Line 13, column 9 to line 13, column 33 in cup_first_non_function
    3. Line 13, column 9 to line 13, column 22 in cup_first_non_function
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
    0. Line 16, column 9 to line 16, column 33 in cup_first_non_function
    1. Line 16, column 30 to line 16, column 33 in cup_first_non_function
    2. Line 13, column 9 to line 13, column 33 in cup_first_non_function
    3. Line 13, column 9 to line 13, column 22 in cup_first_non_function
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in cup_first_non_function
    1. Line 17, column 8 to line 17, column 32 in cup_first_non_function
    2. Line 17, column 29 to line 17, column 32 in cup_first_non_function
    3. Line 13, column 9 to line 13, column 33 in cup_first_non_function
    4. Line 13, column 9 to line 13, column 22 in cup_first_non_function
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in cup_first_non_function
    1. Line 16, column 12 to line 16, column 36 in cup_first_non_function
    2. Line 16, column 33 to line 16, column 36 in cup_first_non_function
    3. Line 13, column 9 to line 13, column 33 in cup_first_non_function
    4. Line 13, column 9 to line 13, column 22 in cup_first_non_function
---*)

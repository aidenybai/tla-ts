(*---
description: bag_plus applied to set_mixed, a SetEnumValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module bag_plus_set_mixed failed.
      2154:0 Attempted to apply the operator overridden by the Java method
      public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
      but it produced the following error:
      Attempted to compare string "a" with non-string:
      1
---*)
---- MODULE bag_plus_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, "a"} (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module bag_plus_set_mixed failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
---*)

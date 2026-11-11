(*---
description: bag_cardinality applied to set_mixed, a SetEnumValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_cardinality_set_mixed failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Bags.BagCardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare string "a" with non-string:
    1
---*)

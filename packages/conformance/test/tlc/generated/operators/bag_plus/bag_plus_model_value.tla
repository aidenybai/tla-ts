(*---
description: bag_plus applied to model_value, a ModelValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE bag_plus_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(mv (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module bag_plus_model_value failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagCup(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot invoke "tlc2.value.impl.Value.toFcnRcd()" because "b" is null
---*)

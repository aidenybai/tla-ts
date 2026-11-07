(*---
description: bag_in applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Bags.java#BagIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_in_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
---*)

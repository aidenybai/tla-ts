(*---
description: bag_in applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Bags.java#BagIn
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
      2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module bag_in_set_of_functions failed.
      2169:0 The second argument of BagIn should be a bag, but instead it is:
      {<<2>>, <<3>>}
---*)
---- MODULE bag_in_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagIn(1, [{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module bag_in_set_of_functions failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.Bags.BagIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
---*)

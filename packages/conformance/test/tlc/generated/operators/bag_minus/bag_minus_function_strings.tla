(*---
description: bag_minus applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {"a", "b"} |-> x] (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagDiff(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Bags.BagDiff(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    class tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')
---*)

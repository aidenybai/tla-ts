(*---
description: function_set of function_lazy, a FcnLambdaValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_function_lazy__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([x \in Nat |-> x]) -> ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Shouldn't call isEmpty() on value [x \in Nat |-> <expression line 14, col 33 to line 14, col 33 of module function_set_function_lazy__set_of_records>]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Shouldn't call isEmpty() on value [x \in Nat |-> <expression line 14, col 33 to line 14, col 33 of module function_set_function_lazy__set_of_records>]
---*)

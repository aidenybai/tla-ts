(*---
description: cap of subset, a SubsetValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_subset__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    {}
    is an element of the function [x \in Nat |-> <expression line 14, col 53 to line 14, col 53 of module cap_subset__function_lazy>]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    {}
    is an element of the function [x \in Nat |-> <expression line 14, col 53 to line 14, col 53 of module cap_subset__function_lazy>]
---*)

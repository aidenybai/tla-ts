(*---
description: cap of function_lazy, a FcnLambdaValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    [a |-> 1]
    is an element of the function [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__set_of_records>]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    [a |-> 1]
    is an element of the function [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__set_of_records>]
---*)

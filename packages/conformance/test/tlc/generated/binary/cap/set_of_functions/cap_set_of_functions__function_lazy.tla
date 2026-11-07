(*---
description: cap of set_of_functions, a SetOfFcnsValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_of_functions__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    <<2>>
    is an element of the function [x \in Nat |-> <expression line 14, col 55 to line 14, col 55 of module cap_set_of_functions__function_lazy>]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    <<2>>
    is an element of the function [x \in Nat |-> <expression line 14, col 55 to line 14, col 55 of module cap_set_of_functions__function_lazy>]
---*)

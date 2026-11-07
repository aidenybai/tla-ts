(*---
description: cup of int_minimum, a IntValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_int_minimum__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \cup ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    -2147483648
    and T:
    [x \in Nat |-> <expression line 14, col 57 to line 14, col 57 of module cup_int_minimum__function_lazy>]
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    -2147483648
    and T:
    [x \in Nat |-> <expression line 14, col 57 to line 14, col 57 of module cup_int_minimum__function_lazy>]
    are not both enumerable
---*)

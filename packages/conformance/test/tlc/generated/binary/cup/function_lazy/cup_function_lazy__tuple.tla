(*---
description: cup of function_lazy, a FcnLambdaValue, and tuple, a TupleValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_function_lazy__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cup (<<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cup_function_lazy__tuple>]
    and T:
    <<1, 2>>
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cup_function_lazy__tuple>]
    and T:
    <<1, 2>>
    are not both enumerable
---*)

(*---
description: cap of function_lazy, a FcnLambdaValue, and false, a BoolValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__false>]
    nor T:
    FALSE
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__false>]
    nor T:
    FALSE
    is enumerable
---*)

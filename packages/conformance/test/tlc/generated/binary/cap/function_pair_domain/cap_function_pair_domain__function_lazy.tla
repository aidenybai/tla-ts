(*---
description: cap of function_pair_domain, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_pair_domain__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    (<<1, 2>> :> 3)
    nor T:
    [x \in Nat |-> <expression line 14, col 72 to line 14, col 72 of module cap_function_pair_domain__function_lazy>]
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    (<<1, 2>> :> 3)
    nor T:
    [x \in Nat |-> <expression line 14, col 72 to line 14, col 72 of module cap_function_pair_domain__function_lazy>]
    is enumerable
---*)

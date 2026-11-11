(*---
description: cup of union, a UnionValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_union__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \cup ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_union__function_lazy failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    [x \in Nat |-> <expression line 14, col 56 to line 14, col 56 of module cup_union__function_lazy>]
    are not both enumerable
---*)

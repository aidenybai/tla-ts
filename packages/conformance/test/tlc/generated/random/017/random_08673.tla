(*---
description: Evaluates a random bool expression, seed 262, number 8673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1] @@ <<>>) @@ (CHOOSE f \in [1..2 -> 1..2] : TRUE)))[((-1) % LET b13424 == 2147483647 IN b13424)] \in {Cardinality(UNION {Nat, Nat}), (-Head(<<3, 1, 2>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

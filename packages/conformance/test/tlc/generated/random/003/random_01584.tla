(*---
description: Evaluates a random function expression, seed 262, number 1584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2526 \in (DOMAIN [x \in Nat |-> x + 1] \cap (FALSE \/ TRUE)) |-> (Cardinality(SUBSET {1}) - (CHOOSE b2527 \in [a |-> 1] : FALSE))] @@ ((Len(<<1>>) :> Len(<<>>)) @@ ((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))))
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

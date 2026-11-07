(*---
description: Evaluates a random function expression, seed 262, number 861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1396 \in (DOMAIN ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) \ (({2, 1, 3} \cap Nat) \cap DOMAIN <<5, 6>>)) |-> (Len(Tail(<<3, 1, 2>>)) - ((CHOOSE f \in [1..2 -> 1..2] : TRUE))[([x \in Nat |-> x + 1])[b1396]])])
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

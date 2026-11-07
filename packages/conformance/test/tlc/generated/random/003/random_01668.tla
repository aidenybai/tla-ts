(*---
description: Evaluates a random function expression, seed 262, number 1668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1])[1] :> LET b2663 == [a |-> 1, b |-> TRUE] IN b2663) @@ ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ (1 :> 2)))) @@ [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT ![(([a |-> 1]).a % Head(<<1, 2>>))] = Cardinality((7 .. 2))]))
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

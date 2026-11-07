(*---
description: Evaluates a random set expression, seed 262, number 8512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [2..1 -> 2..1] : TRUE) \cap [([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![Cardinality(SUBSET {1})] = (-2147483647)]) \ (({b13187 \in <<3, 1, 2>> : [a |-> 1]} \cup {-1, 3}) \cap {b13188 \in {2, 7} : (\A b13189 \in {1, 2} : FALSE)})))
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

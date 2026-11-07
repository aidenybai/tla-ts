(*---
description: Evaluates a random bool expression, seed 262, number 7547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Cardinality((Nat \cap 2..1)), Cardinality(({} \ 1..3))>> = ((IF FALSE THEN -1 ELSE 3 :> ([a |-> 1, b |-> TRUE]).a) @@ [[[x \in Nat |-> x + 1] EXCEPT ![1] = 2] EXCEPT ![(2147483647 * 0)] = (-1 \div 2147483647)])))
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

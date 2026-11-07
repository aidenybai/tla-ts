(*---
description: Evaluates a random int expression, seed 262, number 8236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) @@ [x \in 1..2 |-> x]) @@ (<<5, 6>> @@ [x \in Nat |-> x + 1])))[CASE (1 \in 1..3) -> (3 \div 2147483647) [] OTHER -> (1 \div 2147483647)] * (([[a |-> 1] EXCEPT !.a = 7]).a * ((-1 + 2147483647) - (2147483647 - 1)))))
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

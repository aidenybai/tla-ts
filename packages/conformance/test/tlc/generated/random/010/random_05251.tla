(*---
description: Evaluates a random bool expression, seed 262, number 5251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b8128 \in DOMAIN ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) : ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) \subseteq (~TRUE))) <=> (([<<3, 1, 2>> EXCEPT ![1] = {}] \o [<<>> EXCEPT ![1] = 2147483647]) = [b8129 \in ({1, 2} \cup [x \in 1..2 |-> x]) |-> {b8130 \in SUBSET {1} : FALSE}])))
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

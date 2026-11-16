(*---
description: Evaluates a random int expression, seed 262, number 4560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ (7 :> 7)) @@ (Cardinality(2..1) :> IF TRUE THEN 7 ELSE [x \in 1..2 |-> x])))[(-IF ({1} \subseteq {1, 2}) THEN LET b7153 == 2 IN b7153 ELSE (7 * 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04560 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

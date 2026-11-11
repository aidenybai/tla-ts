(*---
description: Evaluates a random int expression, seed 262, number 3728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] :> 2147483647) @@ [[x \in Nat |-> x + 1] EXCEPT ![0] = 2]) @@ ((2147483647 - 1) :> Cardinality({}))) * (Cardinality((0 .. (1 :> 2))) + ((<<5, 6>>)[-1] \div IF FALSE THEN 0 ELSE 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03728 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

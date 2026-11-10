(*---
description: Evaluates a random function expression, seed 262, number 4111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([<<5, 6>> EXCEPT ![1] = 7] @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) EXCEPT ![IF (<<>> = [x \in Nat |-> x + 1]) THEN Head(<<1, 2>>) ELSE (2 % 1)] = (CHOOSE b6458 \in (Nat \cup 7) : ({} = FALSE))] EXCEPT ![((([a |-> 1]).a + (1 \div 1)) \div (Cardinality(SUBSET {1}) + Cardinality(Nat)))] = Head((CHOOSE r \in [a : {1, 2}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04111 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

(*---
description: Evaluates a random function expression, seed 262, number 5524.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05524 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) @@ [[b8541 \in Nat |-> FALSE] EXCEPT ![Head(<<1>>)] = (2 + 0)]) @@ [b8542 \in {b8543 \in {7, 2} : ({} \subseteq {1, 2})} |-> Head(SelectSeq(<<1>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05524 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

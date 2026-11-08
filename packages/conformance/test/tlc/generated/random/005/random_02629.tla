(*---
description: Evaluates a random int expression, seed 262, number 2629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) @@ [x \in Nat |-> x + 1]))[(-1 + 7)] * IF (TRUE => FALSE) THEN LET b4145 == 1 IN 2 ELSE Head(<<1, 2>>)) - ((([x \in 1..2 |-> x] @@ <<5, 6>>))[([x \in Nat |-> x + 1] * 2147483647)] + ((-1) \div ((1 :> 2))[0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02629 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

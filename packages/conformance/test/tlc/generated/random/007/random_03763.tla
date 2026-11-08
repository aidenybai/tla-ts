(*---
description: Evaluates a random int expression, seed 262, number 3763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (Append(<<3, 1, 2>>, 2) = (2147483647 :> 7)) THEN ((7 :> 2147483647))[(2147483647 \div 7)] ELSE (((1 :> 2) @@ [x \in Nat |-> x + 1]))[([x \in Nat |-> x + 1])[2]] + Cardinality((Len(<<>>) .. Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03763 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

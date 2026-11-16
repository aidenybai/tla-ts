(*---
description: Evaluates a random seq expression, seed 262, number 9.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<1, 2>>)], (([x \in Nat |-> x + 1] @@ <<5, 6>>))[(2 \div 1)], LET b14 == (7 \div 1) IN (CHOOSE b15 \in {1, 2} : FALSE)) \o SelectSeq(SubSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (2147483647 % [a |-> 1]), (-1 + -1)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00009 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

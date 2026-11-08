(*---
description: Evaluates a random function expression, seed 262, number 1961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![1] = (2147483647 \div 1)], LAMBDA p, q : p < q) :> [[(-1 \in 2..1) EXCEPT ![LET b3096 == 0 IN 3] = UNION {{1, 2}, SUBSET {1}}] EXCEPT ![Len(<<3, -1>>)] = (LET b3097 == 7 IN 0 * LET b3098 == 7 IN b3098)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01961 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

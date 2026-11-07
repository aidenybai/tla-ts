(*---
description: Evaluates a random bool expression, seed 262, number 2146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])) /\ (\E b3392 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = <<3, 1, 2>>] : LET b3393 == -1 IN b3392)) \/ ((CHOOSE r \in [a : 2..1] : TRUE) <=> (\E b3394 \in UNION {[x \in 1..2 |-> x], 2..1} : (2..1 \subseteq {2, 1, 3})))))
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

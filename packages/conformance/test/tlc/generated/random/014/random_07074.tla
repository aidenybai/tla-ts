(*---
description: Evaluates a random bool expression, seed 262, number 7074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b10866 \in DOMAIN (Nat @@ [x \in Nat |-> x + 1]) : ((FALSE => TRUE) <=> (<<1>> = [x \in Nat |-> x + 1]))) \/ (\E b10867 \in (UNION {-1, {x \in 1..3 : x > 1}} \cup ({} \cap {x \in 1..3 : x > 1})) : ((2..1 = 2..1) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1])))))
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

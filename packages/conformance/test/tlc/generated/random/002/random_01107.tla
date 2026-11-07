(*---
description: Evaluates a random bool expression, seed 262, number 1107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b1769 == 0 IN 2 .. (3 - 7)) \subseteq DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>)) /\ ((\E b1770 \in ({x \in 1..3 : x > 1} \cap {1, 2}) : (TRUE /\ FALSE)) <=> ({1 : b1771 \in 2..1} \subseteq ({} \ {})))))
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

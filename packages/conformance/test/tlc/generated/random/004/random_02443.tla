(*---
description: Evaluates a random set expression, seed 262, number 2443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([([x \in Nat |-> x + 1] @@ (1 :> 2)) EXCEPT ![([a |-> 1, b |-> TRUE] - 2147483647)] = Head(<<1, 2>>)] \cup (({1} \ Nat) \cup {0, [x \in 1..2 |-> x]})) \cup (DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) \cap DOMAIN (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))))
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

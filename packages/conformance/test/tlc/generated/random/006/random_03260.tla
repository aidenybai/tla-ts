(*---
description: Evaluates a random bool expression, seed 262, number 3260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) EXCEPT ![1] = Len(<<3, 1, 2>>)] \o Append(Append(<<1, 2>>, 0), Head(<<>>))) = [b5191 \in (Cardinality({1}) .. (0 % 7)) |-> ((2147483647 * b5191) + (<<1, 2>> \o <<3, 1, 2>>))]))
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

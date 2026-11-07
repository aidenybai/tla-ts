(*---
description: Evaluates a random bool expression, seed 262, number 2458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a * (2 - 0)) - Cardinality({7 : b3869 \in 1..3})) = ((([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ (3 + <<>>)))[IF [[x \in Nat |-> x + 1] EXCEPT ![7] = 1] THEN (<<1>>)[2147483647] ELSE Len(<<1>>)]))
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

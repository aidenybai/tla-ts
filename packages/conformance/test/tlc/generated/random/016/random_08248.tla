(*---
description: Evaluates a random function expression, seed 262, number 8248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12762 \in DOMAIN (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ [b12763 \in {1} |-> -1]) |-> Cardinality((Cardinality({2, 1, 3}) .. ([a |-> 1] - 7)))])
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

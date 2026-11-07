(*---
description: Evaluates a random function expression, seed 262, number 9429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 :> -1) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) @@ {b14635 \in UNION {{}, {1, 2}} : (Nat \subseteq {x \in 1..3 : x > 1})}) @@ (((7 + 0) - (<<5, 6>> @@ [x \in 1..2 |-> x])) :> (Head(<<5, 6>>) + Cardinality({x \in 1..3 : x > 1})))))
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

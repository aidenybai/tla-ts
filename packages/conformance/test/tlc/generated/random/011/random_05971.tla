(*---
description: Evaluates a random function expression, seed 262, number 5971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (2 + 3) ELSE (0 - 0) :> (LET b9206 == 7 IN b9206 % CASE TRUE -> 2147483647 [] OTHER -> 0)) EXCEPT ![(-(([x \in Nat |-> x + 1] @@ (1 :> 2)))[(-3)])] = Cardinality((({1, 2} \cap {}) \ DOMAIN <<5, 6>>))])
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

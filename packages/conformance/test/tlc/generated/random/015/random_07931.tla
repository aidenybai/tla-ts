(*---
description: Evaluates a random function expression, seed 262, number 7931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 3, b |-> FALSE]).a % IF (TRUE => FALSE) THEN (1 * 7) ELSE ([a |-> 1]).a) :> LET b12245 == (CASE FALSE -> 2147483647 [] OTHER -> 2 - CASE FALSE -> 3 [] OTHER -> 1) IN (([x \in Nat |-> x + 1] @@ (1 :> 2)))[(b12245 + b12245)]))
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

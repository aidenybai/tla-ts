(*---
description: Evaluates a random int expression, seed 262, number 9586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE [([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![(0 + 7)] = CASE FALSE -> -1 [] OTHER -> 3] -> CASE (2..1 = 1..3) -> (3 % 1) [] OTHER -> CASE TRUE -> 2147483647 [] OTHER -> 3 [] OTHER -> IF (~FALSE) THEN (2147483647 - 2147483647) ELSE CASE TRUE -> -1 [] OTHER -> 7 + LET b14887 == (([x \in 1..2 |-> x])[-1] \div (0 % 2)) IN IF (~FALSE) THEN (<<1, 2>> * b14887) ELSE CASE FALSE -> -1 [] OTHER -> b14887))
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

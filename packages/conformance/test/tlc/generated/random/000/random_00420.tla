(*---
description: Evaluates a random function expression, seed 262, number 420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![(0 \div [a |-> 1])] = (<<1, 2>>)[0]] @@ (LET b685 == 1 IN b685 :> (3 + 7))) EXCEPT ![(-Cardinality(({1, 2} \cap Nat)))] = (LET b686 == (3 + 2147483647) IN ([x \in Nat |-> x + 1])[-1] \div LET b687 == (2 - 3) IN CASE TRUE -> b687 [] OTHER -> [x \in 1..2 |-> x])])
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

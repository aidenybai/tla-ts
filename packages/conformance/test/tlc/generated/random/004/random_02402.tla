(*---
description: Evaluates a random function expression, seed 262, number 2402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3802 \in [(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![(2147483647 % 0)] = (3 - 7)] |-> (SelectSeq(<<>>, LAMBDA e : e > 0) \o Tail(<<1>>))] @@ (CHOOSE f \in [1..2 -> {1}] : TRUE)))
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

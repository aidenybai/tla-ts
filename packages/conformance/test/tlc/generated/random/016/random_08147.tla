(*---
description: Evaluates a random set expression, seed 262, number 8147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [((2 :> [a |-> 1]) @@ [[x \in Nat |-> x + 1] EXCEPT ![-1] = 3]) EXCEPT ![IF {2, 2} THEN Head(<<1>>) ELSE Head(<<>>)] = LET b12597 == (CHOOSE b12598 \in 1..3 : FALSE) IN IF FALSE THEN -1 ELSE 2])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 46 to line 14, col 66 of module random_08147
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

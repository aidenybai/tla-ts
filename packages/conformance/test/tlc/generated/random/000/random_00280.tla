(*---
description: Evaluates a random set expression, seed 262, number 280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [((2147483647 :> 2) @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 1]) EXCEPT ![LET b474 == ((1 :> 2))[0] IN Cardinality({2, 1, 3})] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00280 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

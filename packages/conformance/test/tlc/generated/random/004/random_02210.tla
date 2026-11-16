(*---
description: Evaluates a random function expression, seed 262, number 2210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (Tail(<<1>>) = ([x \in Nat |-> x + 1] @@ (1 :> 2))) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] \cap ([a |-> 1] .. 2147483647)) ELSE (Len(<<1>>) % (-1 * 2147483647)) :> ([a |-> (-0), b |-> (~FALSE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02210 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

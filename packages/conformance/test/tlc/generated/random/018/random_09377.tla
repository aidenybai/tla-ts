(*---
description: Evaluates a random function expression, seed 262, number 9377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-0) :> (3 + 3)) @@ ((0 - 1) :> CASE TRUE -> 3 [] OTHER -> 7)) @@ (([a |-> 2, b |-> TRUE] @@ (-1 :> -1)) @@ ((<<5, 6>> @@ [x \in Nat |-> x + 1]) @@ (0 :> [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09377 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer -1 with non-integer:
    "a"
---*)

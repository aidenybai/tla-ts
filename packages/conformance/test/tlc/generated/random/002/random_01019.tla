(*---
description: Evaluates a random bool expression, seed 262, number 1019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<3, 1, 2>>) - [<<5, 6>> EXCEPT ![0] = 7]) \in {(2147483647 + 7), ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])}) /\ (\A b1643 \in {CASE FALSE -> 7 [] OTHER -> -1, (2147483647 % 1)} : ([<<>> EXCEPT ![1] = b1643] = ([x \in 1..2 |-> x] @@ (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 40 to line 14, col 47 of module random_01019
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01019 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

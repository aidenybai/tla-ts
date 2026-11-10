(*---
description: Evaluates a random int expression, seed 262, number 778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~((2147483647 < 0) <=> (~TRUE))) -> ([([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) EXCEPT ![Len(<<1, 2>>)] = (2147483647 \div 2)])[((7 \div 2147483647))[(-1 + 2)]] [] OTHER -> CASE ((2..1 = 1..3) <=> (\E b1278 \in {1, 2} : FALSE)) -> IF ({1} \subseteq {1, 2}) THEN (CHOOSE b1279 \in [a |-> 1] : FALSE) ELSE ([a |-> 1]).a [] OTHER -> ((0 % 1) + CASE TRUE -> -1 [] OTHER -> 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00778 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 292 to line 14, col 325 of module random_00778
---*)

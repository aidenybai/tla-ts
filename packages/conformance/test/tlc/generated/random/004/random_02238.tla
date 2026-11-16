(*---
description: Evaluates a random int expression, seed 262, number 2238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((CHOOSE b3519 \in Nat : FALSE) % ([a |-> 1, b |-> TRUE] + 3)) THEN (-(<<5, 6>>)[1]) ELSE ((3 \div 7) + (2147483647 \div 3)) + ((([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) @@ [[x \in Nat |-> x + 1] EXCEPT ![3] = 2]))[CASE (1 < 1) -> CASE TRUE -> 7 [] OTHER -> -1 [] OTHER -> (-7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02238 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 22 to line 14, col 49 of module random_02238
---*)

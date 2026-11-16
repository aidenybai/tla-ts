(*---
description: Evaluates a random record expression, seed 262, number 9529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b14807 \in UNION {{2, 1, 3}, 1..3} : (1..3 = [x \in Nat |-> x + 1])) + LET b14808 == (3 * 3) IN CASE [x \in Nat |-> x + 1] -> 2147483647 [] OTHER -> b14808), b |-> (((2147483647 - 2) + (CHOOSE b14809 \in {2, 1, 3} : FALSE)) = (([x \in 1..2 |-> x])[3] * (2 % <<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09529 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    [x \in Nat |-> <expression line 14, col 92 to line 14, col 96 of module random_09529>]
---*)

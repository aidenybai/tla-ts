(*---
description: Evaluates a random set expression, seed 262, number 4125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b6479 \in Nat : FALSE) % Cardinality(SUBSET {1})) \div Cardinality({3, 1})), LET b6480 == ((7 % 7) * (CHOOSE b6481 \in 2..1 : FALSE)) IN IF (<<>> = [x \in 1..2 |-> x]) THEN CASE TRUE -> FALSE [] OTHER -> b6480 ELSE UNION {{1}, {x \in 1..3 : x > 1}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04125 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 47 of module random_04125
---*)

(*---
description: Evaluates a random record expression, seed 262, number 301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + CASE (Nat \subseteq {2, 1, 3}) -> ([a |-> 1, b |-> TRUE] * 1) [] OTHER -> (CHOOSE b499 \in {1} : FALSE)] EXCEPT !.a = ((Cardinality(2..1) % (2147483647 * 1)) - CASE (<<5, 6>> \in 2..1) -> CASE FALSE -> 7 [] OTHER -> 3 [] OTHER -> LET b500 == 0 IN 2147483647)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00301 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 73 to line 14, col 95 of module random_00301
---*)

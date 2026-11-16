(*---
description: Evaluates a random bool expression, seed 262, number 9520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cap Nat) \div (CHOOSE b14787 \in [x \in 1..2 |-> x] : FALSE)) \in UNION {{b14788 \in 1..3 : TRUE}, ({1, 2} \cup {2, 1, 3})}) /\ ((IF {1, 2} THEN 1 ELSE 2 + (TRUE % 7)) + (IF FALSE THEN 1 ELSE 7 \in (1..3 \cap 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09520 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 43 to line 14, col 86 of module random_09520
---*)

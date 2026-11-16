(*---
description: Evaluates a random record expression, seed 262, number 7267.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07267 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = (CHOOSE b11189 \in Nat : FALSE)] EXCEPT !.a = @ + ((3 + 2) + (1 - 3))] EXCEPT !.a = LET b11190 == Cardinality(UNION {SUBSET {1}, 0}) IN LET b11191 == (-3) IN (b11190 \div b11190)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07267 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 65 to line 14, col 93 of module random_07267
---*)

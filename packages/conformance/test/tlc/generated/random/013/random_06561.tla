(*---
description: Evaluates a random set expression, seed 262, number 6561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [((3 \div 3) :> {7, 2}) EXCEPT ![(CHOOSE b10083 \in (-1 < 1) : (TRUE => FALSE))] = Cardinality(({x \in 1..3 : x > 1} \ SUBSET {1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06561 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 57 to line 14, col 100 of module random_06561
---*)

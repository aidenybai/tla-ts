(*---
description: Evaluates a random bool expression, seed 262, number 8162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % 7) * (7 % 3)) .. (-LET b12628 == 2 IN 3)) <=> ((CHOOSE b12629 \in ((1 :> 2) \cup {}) : (-1 \in [x \in 1..2 |-> x])) \in (Cardinality({}) .. (CHOOSE b12630 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08162 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 72 to line 14, col 137 of module random_08162
---*)

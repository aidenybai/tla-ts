(*---
description: Evaluates a random seq expression, seed 262, number 9184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b14255 \in (CHOOSE r \in [a : {1}] : TRUE) : (~(FALSE <=> FALSE))), Head(<<([x \in 1..2 |-> x])[3], Cardinality({1, 2})>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09184 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 90 of module random_09184
---*)

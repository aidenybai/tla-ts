(*---
description: Evaluates a random set expression, seed 262, number 5951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9175 \in ((CHOOSE b9176 \in SelectSeq(<<>>, LAMBDA e : e > 0) : (\A b9177 \in 1..3 : FALSE)) .. (LET b9178 == 1 IN b9178 % [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0])) : (~(\A b9179 \in DOMAIN [x \in 1..2 |-> x] : (~TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05951 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 29 to line 14, col 108 of module random_05951
---*)

(*---
description: Evaluates a random function expression, seed 262, number 6332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<([a |-> 1, b |-> TRUE]).a, (CHOOSE b9731 \in Nat : TRUE)>>) :> Head(SubSeq(Tail(<<>>), (7 % 7), <<<<5, 6>>, 0>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06332 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 52 to line 14, col 78 of module random_06332
---*)

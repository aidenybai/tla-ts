(*---
description: Evaluates a random seq expression, seed 262, number 9770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(Tail(Append(<<>>, 2147483647)), (CHOOSE b15165 \in DOMAIN [x \in Nat |-> x + 1] : (1..3 = {1, 2})), (-Head(<<1>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09770 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 66 to line 14, col 129 of module random_09770
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 6370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(Append(Append(<<1>>, 7), (-1 \div 2))), (CHOOSE b9793 \in (Cardinality(2..1) :> (-2147483647)) : (~(b9793 < 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06370 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 69 to line 14, col 147 of module random_06370
---*)

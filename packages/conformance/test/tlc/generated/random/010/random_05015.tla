(*---
description: Evaluates a random int expression, seed 262, number 5015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7803 \in (~((<<3, 1, 2>> = (1 :> 2)) /\ (TRUE /\ FALSE))) : (~((1 \div 0) = Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05015 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 17 to line 14, col 119 of module random_05015
---*)

(*---
description: Evaluates a random int expression, seed 262, number 6111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9404 \in [Append(SubSeq(<<>>, 0, -1), (0 - 2)) EXCEPT ![1] = (Head(<<3, 1, 2>>) - Cardinality({}))] : (((b9404 = 2) <=> ({2, 1, 3} = {2, 1, 3})) <=> ((<<3, 1, 2>> \o <<3, 1, 2>>) = [[x \in Nat |-> x + 1] EXCEPT ![7] = b9404]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06111 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 17 to line 14, col 250 of module random_06111
---*)

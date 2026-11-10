(*---
description: Evaluates a random bool expression, seed 262, number 5421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SelectSeq(Append(<<3, 1, 2>>, 7), LAMBDA e : e > 0)) \o ([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b8395 \in Nat : TRUE)] \o Tail((<<3, 1, 2>> \o <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05421 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 136 to line 14, col 162 of module random_05421
---*)

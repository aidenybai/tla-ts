(*---
description: Evaluates a random seq expression, seed 262, number 4632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq([Tail(<<1, 2>>) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a], LAMBDA p, q : p < q) EXCEPT ![1] = Head(Append([<<3, 1, 2>> EXCEPT ![1] = 3], (CHOOSE b7260 \in -1 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04632 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 162 to line 14, col 187 of module random_04632
---*)

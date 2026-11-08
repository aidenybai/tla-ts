(*---
description: Evaluates a random int expression, seed 262, number 9336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Head(SortSeq(<<>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09336 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 2179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = Len(<<1, 2>>)]).a \in (Len(SubSeq([a |-> 1], 3, 0)) .. Len(Tail([x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02179 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 8751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(SelectSeq(<<0, -1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), (CASE (FALSE /\ FALSE) -> ((1 :> 2))[{x \in 1..3 : x > 1}] [] OTHER -> (1 \div 7) * Head((7 - 7))), Head(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (1..3 \subseteq SUBSET {1}), Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08751 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)

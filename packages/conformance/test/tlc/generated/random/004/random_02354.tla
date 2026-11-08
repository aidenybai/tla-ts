(*---
description: Evaluates a random seq expression, seed 262, number 2354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(SubSeq(SelectSeq({x \in 1..3 : x > 1}, LAMBDA e : e > 0), (0 % 1), (<<3, 1, 2>> % TRUE)), LAMBDA p, q : p < q), (((7 :> 7) % ([a |-> 1, b |-> TRUE]).a) * IF (~TRUE) THEN (-1 * 7) ELSE (CHOOSE b3729 \in {1, 2} : TRUE)), ((CHOOSE r \in [a : 2..1] : TRUE) - ((2 - 3) - (0 % 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02354 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {2, 3}
---*)

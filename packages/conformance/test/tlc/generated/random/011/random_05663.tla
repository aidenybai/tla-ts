(*---
description: Evaluates a random function expression, seed 262, number 5663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((SelectSeq(TRUE, LAMBDA e : e > 0) \o Tail(<<1, 2>>))) :> (~({b8740 \in SUBSET {1} : FALSE} = {0, 7}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05663 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    TRUE
---*)

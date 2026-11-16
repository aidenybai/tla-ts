(*---
description: Evaluates a random seq expression, seed 262, number 7491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((SubSeq(<<1>>, 2, -1) \o Append(<<3, 1, 2>>, -1))) \o Tail(SelectSeq([b11544 \in {x \in 1..3 : x > 1} |-> 3], LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07491 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (2 :> 3 @@ 3 :> 3)
---*)

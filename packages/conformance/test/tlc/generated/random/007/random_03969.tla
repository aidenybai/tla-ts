(*---
description: Evaluates a random seq expression, seed 262, number 3969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(([<<1, 2>> EXCEPT ![1] = 7] \o Tail(<<1>>)), LAMBDA p, q : p < q) \o Append(SelectSeq([b6243 \in SUBSET {1} |-> 3], LAMBDA e : e > 0), [((1 :> 2) :> 1) EXCEPT ![(3 * 1)] = (-0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03969 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    ({} :> 3 @@ {1} :> 3)
---*)

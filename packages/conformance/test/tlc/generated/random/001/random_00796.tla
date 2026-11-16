(*---
description: Evaluates a random bool expression, seed 262, number 796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q), (CHOOSE b1309 \in ({1, 2} \cap SUBSET {1}) : ([a |-> 1, b |-> TRUE] < b1309))) = (IF (-1 = 7) THEN Head(<<1, 2>>) ELSE Head(<<1>>) :> Tail(SubSeq(<<1>>, 0, FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00796 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

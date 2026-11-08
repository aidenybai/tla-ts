(*---
description: Evaluates a random seq expression, seed 262, number 4583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([<<3, 1, 2>> EXCEPT ![1] = 2] = (<<5, 6>> @@ {1, 2})) THEN Head(SortSeq(<<>>, LAMBDA p, q : p < q)) ELSE (([a |-> 1, b |-> TRUE] :> 1) % (7 \div 0)) \o <<IF (FALSE => TRUE) THEN LET b7185 == 2147483647 IN TRUE ELSE (0 * 3), (Len(<<1, 2>>) \div ([a |-> 1]).a)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04583 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1, 2}
---*)

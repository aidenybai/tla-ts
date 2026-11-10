(*---
description: Evaluates a random bool expression, seed 262, number 1866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a, LAMBDA e : e > 0) = (((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE) @@ (<<5, 6>> @@ [a |-> 1])) @@ ((0 \div 2) :> (2147483647 + 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01866 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    2
---*)

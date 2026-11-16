(*---
description: Evaluates a random function expression, seed 262, number 8695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq([[a |-> 1] EXCEPT !.a = @ + 3], ((1 :> 2))[0], (0 \div 3))) :> (Cardinality(({1} \cup {x \in 1..3 : x > 1})) \div Tail(SortSeq(1, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08695 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)

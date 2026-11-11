(*---
description: Evaluates a random bool expression, seed 262, number 6365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)) = {((1 % 0) % (1 + 7)) : b9786 \in {b9787 \in ({} \cap SUBSET {1}) : [[a |-> 1] EXCEPT !.a = 1]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06365 failed.
    Attempted to check equality of the function <<>> with the value:
    {}
---*)

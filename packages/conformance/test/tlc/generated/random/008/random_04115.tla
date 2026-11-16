(*---
description: Evaluates a random bool expression, seed 262, number 4115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b6465 : b6465 \in {1}} \ {1, 1})) = LET b6466 == (CHOOSE b6467 \in (7 :> -1) : (FALSE /\ TRUE)) IN Head(SortSeq(<<>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04115 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

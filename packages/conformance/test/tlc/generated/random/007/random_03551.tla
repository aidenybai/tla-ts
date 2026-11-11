(*---
description: Evaluates a random set expression, seed 262, number 3551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<1>>) .. (CHOOSE b5615 \in 1..3 : TRUE)) \cup {Cardinality(2), ([x \in Nat |-> x + 1]).a}) \cup [b5616 \in ({b5617 : b5617 \in {1}} \cap (3 :> 0)) |-> ([[a |-> 1] EXCEPT !.a = @ + 7] * ([a |-> 1]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03551 failed.
    2181:0 Attempted to compute cardinality of the value
    2
---*)

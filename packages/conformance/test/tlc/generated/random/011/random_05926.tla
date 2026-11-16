(*---
description: Evaluates a random seq expression, seed 262, number 5926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b9135 \in {b9136 \in ({b9137 \in <<3, 1, 2>> : FALSE} \cap {-1 : b9138 \in {x \in 1..3 : x > 1}}) : ((b9136 = 7) < Cardinality(SUBSET {1}))} : (((b9135 - 3) + (0 + b9135)) => (([a |-> 1] = [a |-> 1]) \/ (FALSE => TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05926 failed.
    Attempted to check set membership in a tuple value.
---*)

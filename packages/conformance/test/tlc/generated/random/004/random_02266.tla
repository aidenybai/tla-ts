(*---
description: Evaluates a random record expression, seed 262, number 2266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ({b3569 : b3569 \in {2, 1, 3}} \ DOMAIN [x \in 1..2 |-> x]) \subseteq ({[[a |-> 1] EXCEPT !.a = @ + 7], (1 - 1)} \cap {(CHOOSE b3570 \in {1} : FALSE), Head(<<1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02266 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 17 to line 14, col 82 of module random_02266
---*)

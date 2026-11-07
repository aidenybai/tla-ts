(*---
description: Evaluates a random bool expression, seed 262, number 741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 + 3), Len(<<1, 2>>)} \cup (DOMAIN {2, 1, 3} \cup (3 .. 3))) = {(Head(<<1, 2>>) * Head(<<>>)), (-(CHOOSE b1218 \in {1, 2} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00741 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 49 to line 14, col 64 of module random_00741
---*)

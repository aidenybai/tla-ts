(*---
description: Evaluates a random record expression, seed 262, number 6310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b9701 \in DOMAIN (1 :> 2) : ({1} = SUBSET {1})), b |-> ((TRUE <=> FALSE) /\ (\E b9702 \in {} : TRUE))] EXCEPT !.a = (((1 \in {1, 2}))[(2147483647 * 2)] % LET b9703 == Head(<<>>) IN (CHOOSE b9704 \in {2, 1, 3} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06310 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 77 of module random_06310
---*)

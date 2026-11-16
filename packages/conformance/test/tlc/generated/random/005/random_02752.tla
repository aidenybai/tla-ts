(*---
description: Evaluates a random bool expression, seed 262, number 2752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = 0] EXCEPT ![1] = (1 - 2)] = [b4345 \in {1, 2} |-> (-0)]) \/ (DOMAIN (1 :> 0) = DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = 2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02752 failed.
    Attempted to access record by a non-string argument: 1
---*)

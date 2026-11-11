(*---
description: Evaluates a random bool expression, seed 262, number 1297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq([<<1, 2>> EXCEPT ![1] = 1], Head(<<3, 1, 2>>), (CHOOSE b2064 \in {1} : FALSE))) \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] \ DOMAIN <<5, 6>>) \cup (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01297 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 104 of module random_01297
---*)

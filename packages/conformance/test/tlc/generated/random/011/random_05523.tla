(*---
description: Evaluates a random bool expression, seed 262, number 5523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((DOMAIN <<5, 6>> \cup (1 .. 2147483647))) = [[a |-> LET b8539 == -1 IN 3, b |-> (~FALSE)] EXCEPT !.a = @ + ((CHOOSE b8540 \in {1} : FALSE) + (1 - 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05523 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)

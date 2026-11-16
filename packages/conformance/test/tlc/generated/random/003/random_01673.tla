(*---
description: Evaluates a random int expression, seed 262, number 1673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CHOOSE b2668 \in ((2147483647 .. 3) \cap {2, 2147483647}) : ((<<>> \o <<1, 2>>) = (<<5, 6>> @@ <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01673 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 123 of module random_01673
---*)

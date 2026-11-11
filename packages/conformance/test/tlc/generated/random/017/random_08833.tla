(*---
description: Evaluates a random set expression, seed 262, number 8833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Head([a |-> 1, b |-> TRUE])) : b13680 \in (({2, 1, 3} \ 1..3) \cup (3 \in 1..3))} \cup (DOMAIN (CHOOSE f \in [1..2 -> 2..1] : TRUE) \cap [[a |-> 0, b |-> FALSE] EXCEPT !.a = Cardinality({1, 2})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08833 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 63 to line 14, col 98 of module random_08833
---*)

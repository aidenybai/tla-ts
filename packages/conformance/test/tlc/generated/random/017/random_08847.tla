(*---
description: Evaluates a random bool expression, seed 262, number 8847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13698 \in ({(CHOOSE b13700 \in TRUE : [a |-> 1]) : b13699 \in (2 = -1)} \cup ((1 .. 2) \cup {b13701 \in <<>> : TRUE})) : ({Head(<<3, 1, 2>>), IF FALSE THEN 3 ELSE b13698} = {Cardinality({}) : b13702 \in {b13698, b13698}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08847 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 88 to line 14, col 93 of module random_08847
---*)

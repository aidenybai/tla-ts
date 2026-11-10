(*---
description: Evaluates a random int expression, seed 262, number 1088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1733 \in {((CHOOSE f \in [{} -> {}] : TRUE))[(3 + 2147483647)], (-Cardinality(1..3))} : (DOMAIN (b1733 :> b1733) \subseteq DOMAIN [b1734 \in {2, 1, 3} |-> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01088 failed.
    2178:0 Overflow when computing 3+2147483647
---*)

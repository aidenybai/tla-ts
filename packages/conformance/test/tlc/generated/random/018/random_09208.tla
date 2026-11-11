(*---
description: Evaluates a random bool expression, seed 262, number 9208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b14293 \in UNION {Nat, Nat} : (FALSE => FALSE)) - (-LET b14294 == 0 IN 3)) \in DOMAIN (CHOOSE f \in [{} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09208 failed.
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)

(*---
description: Evaluates a random record expression, seed 262, number 891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ((CHOOSE b1437 \in UNION {7, Nat} : (\E b1438 \in {2, 1, 3} : FALSE)) + Len(<<3, 2147483647>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00891 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    7
---*)

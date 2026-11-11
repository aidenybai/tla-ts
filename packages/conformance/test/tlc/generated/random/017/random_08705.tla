(*---
description: Evaluates a random record expression, seed 262, number 8705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Tail({([a |-> 1]).a : b13482 \in (FALSE => FALSE)}), b |-> ((-LET b13483 == 3 IN -1) < (SubSeq(<<1>>, 0, 2) = (3 + TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08705 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 57 to line 14, col 70 of module random_08705
---*)

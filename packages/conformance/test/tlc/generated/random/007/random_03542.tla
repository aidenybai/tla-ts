(*---
description: Evaluates a random int expression, seed 262, number 3542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {}] : TRUE)).a - LET b5598 == LET b5599 == ({1} \subseteq 2..1) IN Len(<<3, 1, 2>>) IN ((CHOOSE b5600 \in {2, 1, 3} : TRUE) * Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03542 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_03542
---*)

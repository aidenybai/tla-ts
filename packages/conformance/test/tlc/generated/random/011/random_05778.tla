(*---
description: Evaluates a random int expression, seed 262, number 5778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b8904 == (CHOOSE b8905 \in SUBSET {1} : FALSE) IN (b8904 * 0)) * ((LET b8906 == 3 IN b8906 % (3 \div 2147483647)) * (LET b8907 == 3 IN 3 - (<<>> = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05778 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 67 of module random_05778
---*)

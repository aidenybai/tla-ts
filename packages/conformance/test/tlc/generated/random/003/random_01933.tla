(*---
description: Evaluates a random int expression, seed 262, number 1933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(<<3, 1>>) \div (CHOOSE b3038 \in ({} \cap {1}) : (<<1>> = (1 :> 2)))) \div (CHOOSE b3039 \in ({1, 0} \cap (1..3 \ {})) : ((2 \div 2) = (0 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01933 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 39 to line 14, col 89 of module random_01933
---*)

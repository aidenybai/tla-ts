(*---
description: Evaluates a random bool expression, seed 262, number 65.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b92 == (CHOOSE b93 \in DOMAIN (CHOOSE f \in [2..1 -> {1, 2}] : TRUE) : ((CHOOSE b94 \in {1} : TRUE) < (b93 % b93))) IN Append(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q), LET b95 == (b92 * b92) IN (0 - b92)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00065 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 28 to line 14, col 133 of module random_00065
---*)

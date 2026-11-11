(*---
description: Evaluates a random record expression, seed 262, number 4855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + SortSeq([Append(<<1, 2>>, 2) EXCEPT ![1] = (CHOOSE b7569 \in {} : FALSE)], LAMBDA p, q : p < q)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04855 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 122 to line 14, col 148 of module random_04855
---*)

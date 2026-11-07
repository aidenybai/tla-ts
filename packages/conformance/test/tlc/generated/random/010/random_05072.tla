(*---
description: Evaluates a random seq expression, seed 262, number 5072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([(<<FALSE, -1>> \o [<<>> EXCEPT ![1] = 2147483647]) EXCEPT ![1] = ((CHOOSE b7891 \in 2..1 : FALSE) \div Len(<<>>))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 46 to line 14, col 49 of module random_05072
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05072 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 94 to line 14, col 122 of module random_05072
---*)

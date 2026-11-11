(*---
description: Evaluates a random seq expression, seed 262, number 5931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq((~(3 = 1)), LAMBDA p, q : p < q), ((CHOOSE b9143 \in UNION {{2, 1, 3}, 1..3} : ({x \in 1..3 : x > 1} \subseteq {1, 2})) \div ([7 EXCEPT !.a = @ + -1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05931 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
---*)

(*---
description: Evaluates a random set expression, seed 262, number 3855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(CASE TRUE -> -1 [] OTHER -> 1 % (7 \div SUBSET {1})), (CHOOSE b6074 \in (0 .. 1) : (~TRUE))}, {((CHOOSE b6075 \in 2..1 : TRUE) \div Cardinality({1})), Len(SortSeq(3, LAMBDA p, q : p < q))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03855 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 80 to line 14, col 114 of module random_03855
---*)

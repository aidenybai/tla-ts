(*---
description: Evaluates a random int expression, seed 262, number 4205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SortSeq(<<>>, LAMBDA p, q : p < q)) - ((3 \div 7) * (-1 - 0))) + (CASE (TRUE => FALSE) -> (7 * 2..1) [] OTHER -> (2 * 1) * ((CHOOSE r \in [a : 2..1] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04205 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 147 to line 14, col 176 of module random_04205
---*)

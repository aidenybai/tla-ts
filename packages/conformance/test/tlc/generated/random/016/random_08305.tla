(*---
description: Evaluates a random int expression, seed 262, number 8305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 * 7) \div (-1 * 1)) * CASE (~FALSE) -> (-1 * 2) [] OTHER -> Len(<<3, 1, 2>>)) - ((-(CHOOSE b12854 \in 2..1 : FALSE)) \div Head(SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08305 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 106 to line 14, col 135 of module random_08305
---*)

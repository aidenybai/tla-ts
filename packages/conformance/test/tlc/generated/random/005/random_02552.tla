(*---
description: Evaluates a random int expression, seed 262, number 2552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (LET b4024 == (CHOOSE b4025 \in {1, 2} : FALSE) IN (b4024 - 1) \in ((1 .. -1) \ {-1 : b4026 \in {x \in 1..3 : x > 1}})) -> (Cardinality(DOMAIN <<5, 6>>) - (CHOOSE b4027 \in {1, 2147483647} : (0 \in {}))) [] OTHER -> (CASE (TRUE <=> TRUE) -> LET b4028 == <<3, 1, 2>> IN 2147483647 [] OTHER -> (-1 * 2147483647) \div ((3 + 2) + Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02552 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 66 of module random_02552
---*)

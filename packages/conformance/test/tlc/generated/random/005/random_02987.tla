(*---
description: Evaluates a random record expression, seed 262, number 2987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = IF ((2 + 7) \in ({2, 1, 3} \ 1..3)) THEN ((3 * 2) - Head(<<1, 2>>)) ELSE (CHOOSE b4743 \in UNION {1..3, {1, 2}} : (\E b4744 \in 1..3 : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02987 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_02987
---*)

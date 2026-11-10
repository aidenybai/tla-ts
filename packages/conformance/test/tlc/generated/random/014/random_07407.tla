(*---
description: Evaluates a random record expression, seed 262, number 7407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + Head(<<7, 2147483647>>)] EXCEPT !.a = @ + SubSeq(SortSeq(<<3, 2147483647>>, LAMBDA p, q : p < q), ([[a |-> 1] EXCEPT !.a = <<1, 2>>] + (3 + 2147483647)), CASE (0 = 1) -> (2 % 3) [] OTHER -> ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07407 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_07407
---*)

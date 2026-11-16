(*---
description: Evaluates a random bool expression, seed 262, number 7409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + IF TRUE THEN 2147483647 ELSE 2]).a :> (CASE (7 \in {2, 1, 3}) -> Head(<<3, 1, 2>>) [] OTHER -> LET b11415 == [x \in 1..2 |-> x] IN b11415 * (-(-1 \div 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07409 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_07409
---*)

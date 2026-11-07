(*---
description: Evaluates a random int expression, seed 262, number 8825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13662 == (0 \div 2147483647) IN (-b13662) :> ((CHOOSE b13663 \in {1} : FALSE) - CASE FALSE -> 1 [] OTHER -> 2)))[CASE (Tail(FALSE) = ([x \in 1..2 |-> x] @@ <<5, 6>>)) -> ((-3) + (TRUE)[3]) [] OTHER -> (-(CHOOSE b13664 \in {2, 1, 3} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08825 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 98 of module random_08825
---*)

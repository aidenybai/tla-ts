(*---
description: Evaluates a random int expression, seed 262, number 534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(LET b899 == (2147483647 * [x \in 1..2 |-> x]) IN Head(<<3, 1, 2>>) * ((0 - b898) - (b898 % b898))) : b898 \in {([[a |-> 1] EXCEPT !.a = <<5, 6>>]).a, (LET b900 == 3 IN b900 \div (CHOOSE b901 \in 2..1 : FALSE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00534 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 197 to line 14, col 224 of module random_00534
---*)

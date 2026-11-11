(*---
description: Evaluates a random function expression, seed 262, number 5432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8409 \in {(-(-2)), (UNION {{1, 2}, {x \in 1..3 : x > 1}} :> (CHOOSE b8410 \in 2..1 : TRUE))} |-> LET b8411 == ((2147483647 % <<>>) + Len(<<1>>)) IN (-([a |-> 1, b |-> TRUE] \div 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05432 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 106 of module random_05432
---*)

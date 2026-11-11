(*---
description: Evaluates a random int expression, seed 262, number 3218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE r \in [a : 1..2] : TRUE)).a) + (IF ((1 :> 2) => FALSE) THEN (3 \div 2) ELSE Head(<<1, 2>>) \div (([x \in 1..2 |-> x] + 2147483647) * (-1 :> 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03218 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 64 to line 14, col 80 of module random_03218
---*)

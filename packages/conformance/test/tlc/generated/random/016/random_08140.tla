(*---
description: Evaluates a random set expression, seed 262, number 8140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ((1 :> 2) \/ FALSE) -> (CHOOSE r \in [a : {2, 1, 3}] : TRUE) [] OTHER -> (0 * 1) \div ((1 \div 2147483647) \div (-1 % <<1>>))) .. (((1 + 2) \div IF TRUE THEN 1 ELSE 3) + (([a |-> 1]).a + (2 + -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08140 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 24 to line 14, col 40 of module random_08140
---*)

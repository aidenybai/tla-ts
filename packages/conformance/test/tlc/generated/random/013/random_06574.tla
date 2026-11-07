(*---
description: Evaluates a random record expression, seed 262, number 6574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b10098 \in {1, 2} : (<<1>> = <<5, 6>>)), b |-> ((1 \div 3) < IF FALSE THEN 2 ELSE 2147483647)] EXCEPT !.a = @ + ([{b10099 \in 1..3 : TRUE} EXCEPT !.a = @ + (0 - FALSE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06574 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 69 of module random_06574
---*)

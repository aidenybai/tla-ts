(*---
description: Evaluates a random record expression, seed 262, number 9917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (([b15425 \in {1} |-> b15425])[(-2)] % LET b15426 == LET b15427 == 2147483647 IN FALSE IN ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09917 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_09917
---*)

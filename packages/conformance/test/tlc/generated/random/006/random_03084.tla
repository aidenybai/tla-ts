(*---
description: Evaluates a random record expression, seed 262, number 3084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (CHOOSE b4909 \in {b4910 \in {1} : TRUE} : ([a |-> 1, b |-> TRUE] = [a |-> 1]))] EXCEPT !.a = LET b4911 == ((1 - 3) \div (2 % -1)) IN (LET b4912 == 3 IN 3 % (CHOOSE b4913 \in SUBSET {1} : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03084 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_03084
---*)

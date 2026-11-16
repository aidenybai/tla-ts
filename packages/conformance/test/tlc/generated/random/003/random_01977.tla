(*---
description: Evaluates a random bool expression, seed 262, number 1977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b3133 == ((CHOOSE b3134 \in SUBSET {1} : FALSE) \div (7 \div 3)) IN ((CHOOSE b3135 \in {} : [a |-> 1]) \div LET b3136 == 3 IN {1}) \in DOMAIN [[[x \in 1..2 |-> x] EXCEPT ![[a |-> 1]] = 3] EXCEPT ![(2 % 7)] = CASE TRUE -> <<3, 1, 2>> [] OTHER -> 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01977 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 91 to line 14, col 121 of module random_01977
---*)

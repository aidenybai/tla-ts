(*---
description: Evaluates a random function expression, seed 262, number 3615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 % 3) * LET b5704 == 0 IN 3) :> ((-1 + -1) \div (CHOOSE b5705 \in {} : TRUE))) @@ [[a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (7 = 2147483647)] EXCEPT ![(CHOOSE b5706 \in Head([a |-> 1]) : ({x \in 1..3 : x > 1} \subseteq {}))] = ((CHOOSE b5707 \in {1, 2} : TRUE) \div (2147483647 % 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03615 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 71 to line 14, col 96 of module random_03615
---*)

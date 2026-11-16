(*---
description: Evaluates a random bool expression, seed 262, number 2570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{([a |-> 1]).a, (2 * 1)}, {Len(<<1, 2>>) : b4048 \in DOMAIN [x \in 1..2 |-> x]}} = (CASE (<<>> = (1 :> 2)) -> (7 % 1) [] OTHER -> (2 = 2147483647) - (CHOOSE b4049 \in UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} : (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02570 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 174 to line 14, col 247 of module random_02570
---*)

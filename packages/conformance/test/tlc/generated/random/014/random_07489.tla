(*---
description: Evaluates a random record expression, seed 262, number 7489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b11540 \in (({2, 1, 3} \cap {x \in 1..3 : x > 1}) \ UNION {{2, 1, 3}, {1, 2}}) : (UNION {1..3, {1, 2}} = (<<>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07489 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 76 to line 14, col 205 of module random_07489
---*)

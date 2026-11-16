(*---
description: Evaluates a random record expression, seed 262, number 3156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b5029 \in {b5030 \in 2..1 : FALSE} : (FALSE \/ FALSE)), b |-> ((CHOOSE b5031 \in 1..3 : FALSE) = CASE FALSE -> 0 [] OTHER -> 2)] EXCEPT !.a = @ + (-(\A b5032 \in DOMAIN [x \in 1..2 |-> x] : ({1, 2} \subseteq {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03156 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 84 of module random_03156
---*)
